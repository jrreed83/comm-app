
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

// We are explicitly taking advantage of the fact that the filter
// is symmetric about 0
function raisedCosineFilter(beta, sps, nSymbs) {
    let n  = sps * nSymbs / 2;

    function inner(coeffs,i) {
        let xi;
        if (i > n) {
            return coeffs;
        }
        else {
            switch (i) {
                case sps / (2*beta):
                    xi = Math.PI * sinc(0.5/beta);
                    break;
                default:
                    let ii = i / sps;
                    xi = sinc(ii) * Math.cos(Math.PI * beta * ii) / (1 - Math.pow(2.0 * beta * ii,2));
                    break;
            }
            return inner([xi,...coeffs, xi], i+1);
        }
    }

    return inner([1.0],1,n);
}

function rootRaisedCosineFilter(beta, sps, nSymbs) {
    let n  = sps * nSymbs / 2;

    function inner(coeffs,i) {
        let xi;
        let sin;
        let cos;
        if (i > n) {
            return coeffs;
        }
        else {
            switch (i) {
                case sps / (4*beta):
                    sin = Math.sin(Math.PI/(4*beta));
                    cos = Math.cos(Math.PI/(4*beta));
                    xi = (beta/Math.sqrt(2)) * ( sin * (1+(2/Math.PI))  +  cos * (1-(2/Math.PI)));
                    break;
                default:
                    let ii  = i / sps;
                    sin = Math.sin(Math.PI*ii*(1-beta));
                    cos = Math.cos(Math.PI*ii*(1+beta));
                    xi = (sin + (4 * beta * ii * cos)) / (Math.PI*ii*(1 - Math.pow(4*beta*ii,2)));
                    break;
            }
            return inner([xi,...coeffs, xi], i+1);
        }
    }
    let x0 = 1 - beta + 4*(beta / Math.PI);
    return inner([x0],1,n);
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

function register(n) {
    let state = zeros(n);

    function put(x) {
        
        // Has the affect of appending and popping
        let [head, ...tail] = [...state,x]
        state = tail;
        return [...state];
    }

    return {
        put,
    };
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
    let state = register(nSymbs);

    function next(xi) {

        let curr = state.put(xi);
        // Get outputs
        let output = bank.map(path => dot(curr,path));

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