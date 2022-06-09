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

const calculate = (targetVal, bonus, minEp, maxEp) => {
    if (targetVal < minEp) return;
    
    const sols = Array(targetVal - minEp + 1).fill(undefined);
    
    const scoresAndEps = getScoresAndEpsForBonus(bonus);
    
    for (let i = minEp; i <= targetVal; i++) {
        const solIdx = i - minEp; // shift index back
        
        for (let j = 0, scoresLen = scores.length; j < scoresLen; j++) {
            const scoreAndEp = scoresAndEps[j];
            const ep = scoreAndEp.ep;
            
            if (ep < minEp) continue; // skip if under min ep
            if (ep > maxEp) break; // stop if over max ep
            
            const difference = i - ep;
            
            if (difference < 0) break;
            
            if (difference === 0) {
                sols[solIdx] = [scoreAndEp];
                break;
            }
            
            const existingPathIdx = difference - minEp; // shift index back
            const existingPath = sols[existingPathIdx];
            
            if (existingPath) sols[solIdx] = [scoreAndEp, ...existingPath];
        }
        
    }
    
    return sols[sols.length - 1];
};

const isValidForm = ({ currentEp, targetEp, eventBonus, minEp, maxEp }) => {
    if (minEp > targetEp - currentEp) return false;
    if (minEp > maxEp) return false;
    
    return true;
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
    const isValid = isValidForm(formData);
    
    let solution;
    
    if (isValid) {
        const startTime = performance.now();
        solution = calculate(targetEp - currentEp, eventBonus, minEp, maxEp);
        const endTime = performance.now();

        console.log(formData, `${endTime - startTime} ms`);
    } else {
        console.log(formData);
    }
    
    const resultContainer = document.getElementById('result');
    resultContainer.innerHTML = '';

    const resultHeader = document.createElement('h2');
    resultHeader.innerText = 'Result';
    resultContainer.appendChild(resultHeader);
    
    if (solution) {
        const summaryPara = document.createElement('p');
        summaryPara.innerText = `Requires ${solution.length} plays to achieve park.`;

        const table = generateTable(currentEp, solution);

        resultContainer.append(
            summaryPara,
            table
        );
    } else {
        const summaryPara = document.createElement('p');
        summaryPara.innerText = 'Unable to generate possible park.';

        resultContainer.appendChild(summaryPara);
    }
    
    return false;
};

document.getElementById('form')
    .addEventListener('submit', formHandler);

document
    .getElementById('event_bonus')
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