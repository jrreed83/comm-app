
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
        if (i >= 0) {
            return inner([i,...array],i-1);
        } else {
            return array;
        }
    }
    return inner([],n)
}


function raisedCosineFilter(beta, sps, nSymbs) {
    const nSamps = nSymbs * sps >> 1; // Half of the filter    

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

function polyphaseFilter(taps, numPaths) {
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

module.exports = {
    sinc:               sinc,
    raisedCosineFilter: raisedCosineFilter,
    polyphaseFilter:    polyphaseFilter,
};        