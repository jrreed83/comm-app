
function sinc(x) {
    let sx;
    switch (x) {
        case 0:
            sx = 1;
            break;
        default:
            sx = Math.sin(Math.PI*x) / (Math.PI*x);
    }
    return sx
}

function range(n) {
    function inner(array,i) {
        if (i === n) {
            return array;
        } else {
            return inner([...array,i], i+1);
        }
    }
    return inner([],0)
}

function zeros(n) {
    function inner(array,i) {
        if (i == 0) {
            return array;
        } else {
            return inner([0, ...array],i-1);
        }
    }
    return inner([],n);
}

function dot(x,y) {
    let result = 0.0;
    for (let i=0; i < x.length; i++) {
        result += x[i]*y[i];
    }
    return result;
}

function raisedCosineFilter(beta, sps, nSymbs) {
    const nSamps = (nSymbs * sps >> 1) + 1; // back half of filter   

    let back = range(nSamps)
        .map((i) => {
            if (i === sps/(2*beta)) {
                return Math.PI * sinc(0.5/beta);
            } else {
                let ii = i / sps;
                xi = sinc(ii) * Math.cos(Math.PI * beta * ii) / (1 - Math.pow(2.0 * beta * ii,2));
                return xi;
            }
        });
    
    [head, ...tail] = back;
    let front = tail.reverse();
    let total = [...front, ...back];
    return total;
}

function filterBank(taps, numPaths) {
    const tapsPerPath = taps.length / numPaths;
    let i;
    // Initialize the array of numPaths, an array of a
    let structure = [];
    for (i = 0; i < numPaths; i++) {
        structure.push([]);
    }

    // Loop over all taps and allocate
    for (i = 0; i < taps.length; i++) {
        let pi = i % numPaths; // Which path are we apart of?
        structure[pi] = [...structure[pi], taps[i]];    // Add to that path
    }

    return structure;
}

function pulseShaper(config) {
    // Pull out configuration
    let {beta, sps, nSymbs} = config;

    // Get the filter taps
    let filterCoeffs = raisedCosineFilter(beta, sps, nSymbs);

    // Make a filter bank for efficient implementation
    [h, ...filterCoeffs] = filterCoeffs;
    let bank = filterBank(filterCoeffs, sps);  

    // Inisialize the filter state
    let state = zeros(nSymbs);

    function next(xi) {
        // Update state
        state = [...state,xi];
        [h, ...state] = state;

        // Get outputs
        let output = bank.map(path => dot(path, state));

        return output;
    }

    function getState() {
        return state;
    }

    function getBank() {
        return bank;
    }

    return {
        next,
        getState,
        getBank,
    };
}

module.exports = {
    pulseShaper,
};        