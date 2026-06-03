// ============================================
// CONVERTER FUNCTIONS
// ============================================

// Electrolyte Converter
function convertElectrolyte() {
    const element = document.getElementById('electrolyteElement').value;
    const value = parseFloat(document.getElementById('electrolyteValue').value);
    const fromUnit = document.getElementById('electrolyteFrom').value;
    
    if (!value || isNaN(value)) {
        document.getElementById('electrolyteResult').textContent = 'مقدار را وارد کنید';
        return;
    }
    
    const factors = {
        sodium: { mEqToMg: 23, mgTomEq: 0.0435 },
        potassium: { mEqToMg: 39, mgTomEq: 0.0256 },
        calcium: { mEqToMg: 20, mgTomEq: 0.05 },
        magnesium: { mEqToMg: 12, mgTomEq: 0.0833 }
    };
    
    const factor = factors[element];
    let result, unit, formula;
    
    if (fromUnit === 'mEq') {
        result = value * factor.mEqToMg;
        unit = 'mg';
        formula = `${value} mEq × ${factor.mEqToMg} =`;
    } else {
        result = value * factor.mgTomEq;
        unit = 'mEq';
        formula = `${value} mg × ${factor.mgTomEq} =`;
    }
    
    document.getElementById('electrolyteResult').innerHTML = `
        ${formula}<br>
        <strong>${result.toFixed(2)} ${unit}</strong>
    `;
}

// Percentage Converter
function convertPercentage() {
    const percentage = parseFloat(document.getElementById('percentageValue').value);
    const volume = parseFloat(document.getElementById('percentageVolume').value);
    
    if (!percentage || !volume || isNaN(percentage) || isNaN(volume)) {
        document.getElementById('percentageResult').textContent = 'مقادیر را وارد کنید';
        return;
    }
    
    // 1% = 10 mg/ml
    const mgPerMl = percentage * 10;
    const totalMg = mgPerMl * volume;
    
    document.getElementById('percentageResult').innerHTML = `
        ${percentage}% محلول:<br>
        <strong>${mgPerMl.toFixed(2)} mg/ml</strong><br>
        ${totalMg.toFixed(2)} mg in ${volume} ml
    `;
}

// Unit Converter
function convertUnits() {
    const fromUnit = document.getElementById('unitFrom').value;
    const toUnit = document.getElementById('unitTo').value;
    const value = parseFloat(document.getElementById('unitValue').value);
    
    if (!value || isNaN(value)) {
        document.getElementById('unitResult').textContent = 'مقدار را وارد کنید';
        return;
    }
    
    // Conversion factors
    const conversions = {
        mcg: { mg: 0.001, g: 0.000001, units: null },
        mg: { mcg: 1000, g: 0.001, units: null },
        g: { mcg: 1000000, mg: 1000, units: null },
        units: { mcg: null, mg: null, g: null }
    };
    
    if (fromUnit === toUnit) {
        document.getElementById('unitResult').textContent = `${value} ${fromUnit}`;
        return;
    }
    
    if (conversions[fromUnit] && conversions[fromUnit][toUnit] !== null) {
        const result = value * conversions[fromUnit][toUnit];
        document.getElementById('unitResult').innerHTML = `
            ${value} ${fromUnit} = <br>
            <strong>${result.toFixed(4)} ${toUnit}</strong>
        `;
    } else {
        document.getElementById('unitResult').textContent = 'تبدیل برای این واحدها تعریف نشده است';
    }
}

// Drip Rate Calculator
function calculateDripRate() {
    const volume = parseFloat(document.getElementById('dripVolume').value);
    const time = parseFloat(document.getElementById('dripTime').value);
    const dropFactor = parseFloat(document.getElementById('dripFactor').value);
    
    if (!volume || !time || isNaN(volume) || isNaN(time)) {
        document.getElementById('dripResult').textContent = 'مقادیر را وارد کنید';
        return;
    }
    
    if (time === 0) {
        document.getElementById('dripResult').textContent = 'زمان نمی‌تواند صفر باشد';
        return;
    }
    
    const mlPerHour = volume / time;
    const dropsPerMin = (mlPerHour * dropFactor) / 60;
    
    document.getElementById('dripResult').innerHTML = `
        سرعت تزریق:<br>
        <strong>${mlPerHour.toFixed(1)} ml/ساعت</strong><br>
        <strong>${dropsPerMin.toFixed(1)} drops/min</strong>
    `;
}

// BMI Calculator
function calculateBMI() {
    const weight = parseFloat(document.getElementById('bmiWeight').value);
    const height = parseFloat(document.getElementById('bmiHeight').value);
    
    if (!weight || !height || isNaN(weight) || isNaN(height)) {
        document.getElementById('bmiResult').textContent = 'مقادیر را وارد کنید';
        return;
    }
    
    if (height === 0) {
        document.getElementById('bmiResult').textContent = 'قد نمی‌تواند صفر باشد';
        return;
    }
    
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    
    let category, color, interpretation;
    
    if (bmi < 18.5) {
        category = 'کم‌وزن';
        color = '#f59e0b';
        interpretation = 'نیاز به افزایش وزن';
    } else if (bmi < 24.9) {
        category = 'طبیعی';
        color = '#10b981';
        interpretation = 'وزن ایده‌آل';
    } else if (bmi < 29.9) {
        category = 'اضافه وزن';
        color = '#f59e0b';
        interpretation = 'نیاز به کاهش وزن';
    } else if (bmi < 34.9) {
        category = 'چاقی درجه ۱';
        color = '#ef4444';
        interpretation = 'خطر متوسط';
    } else if (bmi < 39.9) {
        category = 'چاقی درجه ۲';
        color = '#dc2626';
        interpretation = 'خطر بالا';
    } else {
        category = 'چاقی مفرط';
        color = '#991b1b';
        interpretation = 'خطر بسیار بالا';
    }
    
    const idealMin = 18.5 * (heightM * heightM);
    const idealMax = 24.9 * (heightM * heightM);
    
    document.getElementById('bmiResult').innerHTML = `
        BMI: <strong style="color: ${color}">${bmi.toFixed(1)}</strong><br>
        وضعیت: <strong>${category}</strong><br>
        ${interpretation}<br>
        وزن ایده‌آل: ${idealMin.toFixed(1)} تا ${idealMax.toFixed(1)} کیلوگرم
    `;
}

// Body Surface Area Calculator
function calculateBSA() {
    const weight = parseFloat(document.getElementById('bsaWeight').value);
    const height = parseFloat(document.getElementById('bsaHeight').value);
    const formula = document.getElementById('bsaFormula').value;
    
    if (!weight || !height || isNaN(weight) || isNaN(height)) {
        document.getElementById('bsaResult').textContent = 'مقادیر را وارد کنید';
        return;
    }
    
    if (height === 0) {
        document.getElementById('bsaResult').textContent = 'قد نمی‌تواند صفر باشد';
        return;
    }
    
    let bsa;
    
    switch(formula) {
        case 'mosteller':
            // Mosteller formula: sqrt(weight * height / 3600)
            bsa = Math.sqrt((weight * height) / 3600);
            break;
        case 'dubois':
            // DuBois formula: 0.007184 * weight^0.425 * height^0.725
            bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
            break;
        case 'haycock':
            // Haycock formula: 0.024265 * weight^0.5378 * height^0.3964
            bsa = 0.024265 * Math.pow(weight, 0.5378) * Math.pow(height, 0.3964);
            break;
        default:
            bsa = Math.sqrt((weight * height) / 3600);
    }
    
    document.getElementById('bsaResult').innerHTML = `
        BSA: <strong>${bsa.toFixed(3)} متر مربع</strong><br>
        (با فرمول ${formula})
    `;
}

// Ideal Body Weight Calculator
function calculateIBW() {
    const height = parseFloat(document.getElementById('ibwHeight').value);
    const gender = document.getElementById('ibwGender').value;
    const formula = document.getElementById('ibwFormula').value;
    
    if (!height || isNaN(height)) {
        document.getElementById('ibwResult').textContent = 'قد را وارد کنید';
        return;
    }
    
    let ibw;
    let heightInch = height / 2.54;
    
    switch(formula) {
        case 'devine':
            // Devine formula
            if (gender === 'male') {
                ibw = 50 + 2.3 * (heightInch - 60);
            } else {
                ibw = 45.5 + 2.3 * (heightInch - 60);
            }
            break;
        case 'robinson':
            // Robinson formula
            if (gender === 'male') {
                ibw = 52 + 1.9 * (heightInch - 60);
            } else {
                ibw = 49 + 1.7 * (heightInch - 60);
            }
            break;
        case 'miller':
            // Miller formula
            if (gender === 'male') {
                ibw = 56.2 + 1.41 * (heightInch - 60);
            } else {
                ibw = 53.1 + 1.36 * (heightInch - 60);
            }
            break;
        default:
            // Devine as default
            if (gender === 'male') {
                ibw = 50 + 2.3 * (heightInch - 60);
            } else {
                ibw = 45.5 + 2.3 * (heightInch - 60);
            }
    }
    
    // Convert from kg to kg (already in kg)
    document.getElementById('ibwResult').innerHTML = `
        وزن ایده‌آل: <strong>${ibw.toFixed(1)} کیلوگرم</strong><br>
        (برای ${gender === 'male' ? 'مرد' : 'زن'}، فرمول ${formula})
    `;
}

// Creatinine Clearance Calculator (Cockcroft-Gault)
function calculateCrCl() {
    const age = parseFloat(document.getElementById('crclAge').value);
    const weight = parseFloat(document.getElementById('crclWeight').value);
    const creatinine = parseFloat(document.getElementById('crclValue').value);
    const gender = document.getElementById('crclGender').value;
    
    if (!age || !weight || !creatinine || isNaN(age) || isNaN(weight) || isNaN(creatinine)) {
        document.getElementById('crclResult').textContent = 'همه مقادیر را وارد کنید';
        return;
    }
    
    if (creatinine === 0) {
        document.getElementById('crclResult').textContent = 'کراتینین نمی‌تواند صفر باشد';
        return;
    }
    
    let crcl;
    if (gender === 'male') {
        crcl = ((140 - age) * weight) / (72 * creatinine);
    } else {
        crcl = ((140 - age) * weight) / (72 * creatinine) * 0.85;
    }
    
    let interpretation;
    if (crcl > 90) {
        interpretation = 'عملکرد کلیه طبیعی';
    } else if (crcl > 60) {
        interpretation = 'اختلال خفیف کلیوی';
    } else if (crcl > 30) {
        interpretation = 'اختلال متوسط کلیوی';
    } else if (crcl > 15) {
        interpretation = 'اختلال شدید کلیوی';
    } else {
        interpretation = 'نارسایی کلیه';
    }
    
    document.getElementById('crclResult').innerHTML = `
        CrCl: <strong>${crcl.toFixed(1)} ml/min</strong><br>
        ${interpretation}<br>
        (فرمول Cockcroft-Gault)
    `;
}

// Compatibility Checker
function checkCompatibility() {
    const drug1 = document.getElementById('compatDrug1').value;
    const drug2 = document.getElementById('compatDrug2').value;
    const solution = document.getElementById('compatSolution').value;
    
    if (!drug1 || !drug2) {
        document.getElementById('compatResult').textContent = 'هر دو دارو را انتخاب کنید';
        return;
    }
    
    if (drug1 === drug2) {
        document.getElementById('compatResult').innerHTML = `
            <strong style="color: #10b981;">همان دارو است</strong><br>
            سازگاری کامل
        `;
        return;
    }
    
    // This is a simplified compatibility check
    // In a real app, you would have a comprehensive compatibility database
    const incompatiblePairs = [
        ['heparin', 'amoxicillin'],
        ['heparin', 'phenobarbital'],
        ['furosemide', 'gentamicin'],
        ['furosemide', 'vancomycin'],
        ['norepinephrine', 'sodium bicarbonate']
    ];
    
    const isIncompatible = incompatiblePairs.some(pair => 
        (pair[0] === drug1 && pair[1] === drug2) || 
        (pair[0] === drug2 && pair[1] === drug1)
    );
    
    if (isIncompatible) {
        document.getElementById('compatResult').innerHTML = `
            <strong style="color: #ef4444;">⚠️ ناسازگار</strong><br>
            این داروها نباید از یک Y-Site تزریق شوند
        `;
    } else {
        document.getElementById('compatResult').innerHTML = `
            <strong style="color: #10b981;">✓ سازگار</strong><br>
            می‌توان از یک Y-Site تزریق کرد<br>
            (بررسی بیشتر توصیه می‌شود)
        `;
    }
}

// Dose Calculator
function calculateDose() {
    const needed = parseFloat(document.getElementById('doseNeeded').value);
    const concentration = parseFloat(document.getElementById('doseConcentration').value);
    const vialVolume = parseFloat(document.getElementById('doseVialVolume').value);
    
    if (!needed || !concentration || !vialVolume || 
        isNaN(needed) || isNaN(concentration) || isNaN(vialVolume)) {
        document.getElementById('doseResult').textContent = 'همه مقادیر را وارد کنید';
        return;
    }
    
    if (concentration === 0) {
        document.getElementById('doseResult').textContent = 'غلظت نمی‌تواند صفر باشد';
        return;
    }
    
    const volumeNeeded = needed / concentration;
    const vialsNeeded = Math.ceil(volumeNeeded / vialVolume);
    
    if (volumeNeeded > vialVolume) {
        document.getElementById('doseResult').innerHTML = `
            حجم مورد نیاز: <strong>${volumeNeeded.toFixed(2)} ml</strong><br>
            تعداد ویال: <strong>${vialsNeeded} عدد</strong><br>
            <span style="color: #f59e0b;">نکته: نیاز به بیش از یک ویال است</span>
        `;
    } else {
        document.getElementById('doseResult').innerHTML = `
            حجم مورد نیاز: <strong>${volumeNeeded.toFixed(2)} ml</strong><br>
            یک ویال کافی است
        `;
    }
}

// Initialize compatibility dropdowns
function initCompatibilityDropdowns() {
    const drugSelect1 = document.getElementById('compatDrug1');
    const drugSelect2 = document.getElementById('compatDrug2');
    
    if (!drugSelect1 || !drugSelect2) return;
    
    // Clear existing options
    drugSelect1.innerHTML = '<option value="">انتخاب دارو</option>';
    drugSelect2.innerHTML = '<option value="">انتخاب دارو</option>';
    
    // Add drugs to both dropdowns
    Object.entries(drugDatabase).forEach(([id, drug]) => {
        const option1 = document.createElement('option');
        option1.value = id;
        option1.textContent = drug.persianName;
        drugSelect1.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = id;
        option2.textContent = drug.persianName;
        drugSelect2.appendChild(option2);
    });
}

// Initialize converters when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initCompatibilityDropdowns();
    
    // Add event listeners to converter inputs
    const converterInputs = [
        'electrolyteValue', 'electrolyteFrom', 'electrolyteElement',
        'percentageValue', 'percentageVolume',
        'unitValue', 'unitFrom', 'unitTo',
        'dripVolume', 'dripTime', 'dripFactor',
        'bmiWeight', 'bmiHeight',
        'bsaWeight', 'bsaHeight', 'bsaFormula',
        'ibwHeight', 'ibwGender', 'ibwFormula',
        'crclAge', 'crclWeight', 'crclValue', 'crclGender',
        'compatDrug1', 'compatDrug2', 'compatSolution',
        'doseNeeded', 'doseConcentration', 'doseVialVolume'
    ];
    
    converterInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                // Optional: auto-calculate on change
            });
        }
    });
});
// Add this at the end of converters.js
document.addEventListener('DOMContentLoaded', () => {
    // Add Enter key support for all converter inputs
    document.querySelectorAll('.converter-body input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const card = input.closest('.converter-card, .tool-card');
                const button = card?.querySelector('.converter-btn, .tool-btn');
                if (button) button.click();
            }
        });
    });
});