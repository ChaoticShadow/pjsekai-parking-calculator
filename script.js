// "use strict";

class SolutionNode {
    scoreAndEp;
    prevNode;
    length;

    constructor(scoreAndEp, prevNode, length) {
        this.scoreAndEp = scoreAndEp;
        this.prevNode = prevNode;
        this.length = length;
    }

    valueOf() {
        if (this.prevNode) return [this.scoreAndEp, ...this.prevNode.valueOf()];

        return [this.scoreAndEp];
    }
}

const scores = Array.from(Array(75).fill(0)).map((_, i) => i * 20000);

const bonusToScoresAndEps = {};

const calculateScoresAndEpsForBonus = (bonus) => {
    const baseMultiplier = 100 * (1 + bonus / 100);
    
    return scores.map((score) => {
        const ep = Math.floor(baseMultiplier * (1 + score /  2000000));
        return {
            score,
            ep
        };
    });
};

const getScoresAndEpsForBonus = (bonus) => {
    if (bonusToScoresAndEps[bonus]) return bonusToScoresAndEps[bonus];
    
    const scoreAndEp = calculateScoresAndEpsForBonus(bonus);
    bonusToScoresAndEps[bonus] = scoreAndEp;
    
    return scoreAndEp;
};

const getMinMaxEpIndexes = (scoresAndEps, minEp, maxEp) => {
    let minMaxIdx = {
        min: -1,
        max: -1
    };

    for (let i = 0, scoreAndEpsLength = scoresAndEps.length; i < scoreAndEpsLength; i++) {
        const { ep } = scoresAndEps[i];
        if (ep === minEp) minMaxIdx.min = i;
        if (ep === maxEp) minMaxIdx.max = i;
    }

    return minMaxIdx;
}

const calculate = (targetVal, bonus, minEp, maxEp) => {
    const solutionLength = targetVal - minEp + 1;
    const sol = Array(solutionLength).fill(undefined);
    
    const scoresAndEps = getScoresAndEpsForBonus(bonus);
    const { min: minEpIdx, max: maxEpIdx } = getMinMaxEpIndexes(scoresAndEps, minEp, maxEp);

    for (let i = minEp; i <= targetVal; i++) {
        const solIdx = i - minEp; // shift index back
        
        for (let j = minEpIdx; j <= maxEpIdx; j++) {
            const scoreAndEp = scoresAndEps[j];
            const ep = scoreAndEp.ep;
            
            const difference = i - ep;

            if (difference < 0) break;
            
            if (difference === 0) {
                sol[solIdx] = new SolutionNode(scoreAndEp, null, 1);
                break;
            }
            
            const existingPathIdx = difference - minEp; // shift index back
            const existingPath = sol[existingPathIdx];

            if (existingPath == null) continue; // skip if not possible

            const currentSol = sol[solIdx];

            if (currentSol == null || currentSol.length >= existingPath.length + 1) {
                sol[solIdx] = new SolutionNode(scoreAndEp, existingPath, existingPath.length + 1);
            }
        }
    }
    
    return sol[solutionLength - 1].valueOf();
};

const isValidForm = ({ currentEp, targetEp, eventBonus, minEp, maxEp }) => {
    if (minEp > targetEp - currentEp) return { isValid: false, reason: "Difference between current and target ep is less than min ep." };
    if (minEp > maxEp) return { isValid: false, reason: "Min ep is greater than max ep." };

    const scoresAndEps = getScoresAndEpsForBonus(eventBonus);
    const { min: minEpIdx, max: maxEpIdx } = getMinMaxEpIndexes(scoresAndEps, minEp, maxEp);
    
    if (minEpIdx === -1) return { isValid: false, reason: "Invalid min ep for the given event bonus." };
    if (maxEpIdx === -1) return { isValid: false, reason: "Invalid max ep for the given event bonus." };

    return { isValid: true, reason: "" };
}

const generateTable = (currentEp, solution) => {
    let table = document.createElement('table');
    let thead = document.createElement('thead');
    let tbody = document.createElement('tbody');
    
    table.append(
        thead,
        tbody
    );
    
    {
        let row = document.createElement('tr');
        
        let checkboxTh = document.createElement('th');
        
        let scoreTh = document.createElement('th');
        scoreTh.innerText = 'Score range';
        
        let epTh = document.createElement('th');
        epTh.innerText = 'Ep gained';
        
        let expectEpTh = document.createElement('th');
        expectEpTh.innerText = 'Expected ep';
        
        row.append(
            checkboxTh,
            scoreTh,
            epTh,
            expectEpTh
        );
        
        thead.appendChild(row);
    }
    
    let epSum = currentEp;
    solution.forEach(({ score, ep }) => {
        epSum += ep;
    
        let row = document.createElement('tr');
    
        let checkboxTd = document.createElement('td');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', (e) => {
            if (checkbox.checked) {
                row.classList.add('checked');
            } else {
                row.classList.remove('checked');
            }
        });
        checkboxTd.appendChild(checkbox);
        
        let scoreTd = document.createElement('td');
        scoreTd.innerText = `${score.toLocaleString()} ~ ${(score + 19999).toLocaleString()}`;
        
        let epTd = document.createElement('td');
        epTd.innerText = ep;
        
        let expectEpTd = document.createElement('td');
        expectEpTd.innerText = epSum.toLocaleString();
        
        row.append(
            checkboxTd,
            scoreTd,
            epTd,
            expectEpTd
        );
        
        tbody.appendChild(row);
    });
    
    return table;
};

const formHandler = (e) => {
    e.preventDefault();

    const resultSummary = document.getElementById('result-summary');
    resultSummary.innerText = '';

    const inputErrorWrapper = document.getElementById('input-error-wrapper');
    inputErrorWrapper.style.display = 'none';

    const tableWrapper = document.getElementById('table-wrapper');
    tableWrapper.innerHTML = '';

    const { elements } = e.target;
    
    const currentEp = parseInt(elements.current_ep.value);
    const targetEp = parseInt(elements.target_ep.value);
    
    const eventBonus = parseInt(elements.event_bonus.value);
    
    const minEp = parseInt(elements.min_ep.value);
    const maxEp = parseInt(elements.max_ep.value);
    
    const formData = {
        currentEp,
        targetEp,
        eventBonus,
        minEp,
        maxEp
    };

    const { isValid, reason } = isValidForm(formData);

    if (!isValid) {
        console.log(formData, reason);

        inputErrorWrapper.querySelector('#input-error-msg').innerText = reason;
        inputErrorWrapper.style.display = 'block';
    } else {  
        resultSummary.innerText = 'Calculating...';

        const startTime = performance.now();
        const solution = calculate(targetEp - currentEp, eventBonus, minEp, maxEp);
        const endTime = performance.now();

        console.log(formData, `${endTime - startTime} ms`);
        
        if (solution) {
            resultSummary.innerText = `${solution.length} plays are required to achieve the desired park.`;

            const table = generateTable(currentEp, solution);

            tableWrapper.appendChild(table);
        } else {
            resultSummary.innerText = 'Unable to generate possible park.';
        }
    }
};

document.getElementById('form')
    .addEventListener('submit', formHandler);

document.getElementById('event_bonus')
    .addEventListener('change', (e) => {
        const eventBonus = e.target.value;
        
        const scoresAndEps = getScoresAndEpsForBonus(eventBonus);
        
        const minEp = scoresAndEps[0].ep;
        const maxEp = scoresAndEps[scoresAndEps.length - 1].ep
        
        const minEpInput = document.getElementById('min_ep');
        minEpInput.value = Math.max(minEp, Math.min(minEpInput.value, maxEp)).toString();
        minEpInput.min = minEp.toString();
        minEpInput.max = maxEp.toString();
        
        const maxEpInput = document.getElementById('max_ep');
        maxEpInput.value = Math.max(minEp, Math.min(maxEpInput.value, maxEp)).toString();
        maxEpInput.min = minEp.toString();
        maxEpInput.max = maxEp.toString();
    });