const units = {
    temperature: ["Celsius", "Fahrenheit"],
    weight: ["Grams", "Kilograms", "Pounds", "Ounces"],
    distance: ["Meters", "Kilometers", "Miles", "Feet"]
};

const defaults = {
    temperature: { value: "0", from: "Celsius", to: "Fahrenheit" },
    weight: { value: "1", from: "Kilograms", to: "Grams" },
    distance: { value: "1", from: "Meters", to: "Kilometers" }
};

let currentCategory = "temperature";
let debounceTimer;
let currentController = null;

// -------------------- UI --------------------

function applyDefaults() {
    const input = document.getElementById('input-value');
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');

    const def = defaults[currentCategory];

    input.value = def.value;
    from.value = def.from;
    to.value = def.to;
}

function updateSelectors() {
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');

    const options = units[currentCategory]
        .map(u => `<option value="${u}">${u}</option>`)
        .join('');

    from.innerHTML = options;
    to.innerHTML = options;

    if (to.options.length > 1) to.selectedIndex = 1;
}

// -------------------- INPUT CONTROL --------------------

function setupInputControl() {
    const input = document.getElementById('input-value');

    // Block invalid typing
    input.addEventListener('keydown', (e) => {
        const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

        if (allowed.includes(e.key)) return;

        if (/^\d$/.test(e.key)) return;

        if (e.key === '.' && !input.value.includes('.')) return;

        if (e.key === '-' && input.selectionStart === 0 && !input.value.includes('-')) return;

        if (e.key === '+' && input.selectionStart === 0 && !input.value.includes('+')) return;

        e.preventDefault();
    });

    // Clean pasted input
    input.addEventListener('paste', (e) => {
        e.preventDefault();

        let text = (e.clipboardData || window.clipboardData).getData('text');

        text = text.replace(/[^0-9.+-]/g, '');

        const parts = text.split('.');
        if (parts.length > 2) {
            text = parts[0] + '.' + parts.slice(1).join('');
        }

        text = text.replace(/(?!^)[+-]/g, '');

        document.execCommand('insertText', false, text);
    });

    input.addEventListener('input', debounceConversion);
}

// -------------------- VALIDATION --------------------

function isTypingState(val) {
    return val === "" || val === "-" || val === "." || val === "-." || val === "+.";
}

function isValidNumber(val) {
    const num = Number(val);
    return val !== "" && !isNaN(num) && isFinite(num);
}

function normalize(val) {
    if (val.startsWith('.')) return '0' + val;
    if (val.startsWith('-.')) return '-0' + val.slice(1);
    return val;
}

// -------------------- DEBOUNCE --------------------

function debounceConversion() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performConversion, 300);
}

// -------------------- CONVERSION --------------------

async function performConversion() {
    const input = document.getElementById('input-value');
    const output = document.getElementById('output-value');
    const from = document.getElementById('unit-from').value;
    const to = document.getElementById('unit-to').value;

    let val = input.value.trim();

    if (isTypingState(val)) {
        output.value = "";
        return;
    }

    if (!isValidNumber(val)) {
        output.value = "";
        return;
    }

    val = normalize(val);

    if (from === to) {
        output.value = format(val);
        return;
    }

    output.value = "Converting...";

    // Cancel previous request
    if (currentController) currentController.abort();
    currentController = new AbortController();

    try {
        const res = await fetch('/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                value: val,
                unit_from: from,
                unit_to: to,
                category: currentCategory
            }),
            signal: currentController.signal
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        if (!data.success || data.result == null) {
            output.value = "";
        } else {
            output.value = format(data.result);
        }

    } catch (err) {
        if (err.name === "AbortError") return;
        output.value = "Error";
    }
}

// -------------------- FORMAT --------------------

function format(val) {
    const num = Number(val);

    if (!isFinite(num)) return "";

    if (Math.abs(num) >= 1_000_000) {
        return num.toExponential(4);
    }

    return parseFloat(num.toFixed(4));
}

// -------------------- SWAP --------------------

function setupSwap() {
    document.querySelector('.swap-icon').addEventListener('click', () => {
        const from = document.getElementById('unit-from');
        const to = document.getElementById('unit-to');

        [from.value, to.value] = [to.value, from.value];

        performConversion();
    });
}

// -------------------- EVENTS --------------------

function setupNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.active')?.classList.remove('active');

            btn.classList.add('active');
            currentCategory = btn.dataset.category;

            document.getElementById('category-title').innerText =
                currentCategory.charAt(0).toUpperCase() +
                currentCategory.slice(1);

            updateSelectors();
            applyDefaults();
            performConversion();
        });
    });

    document.getElementById('unit-from').addEventListener('change', performConversion);
    document.getElementById('unit-to').addEventListener('change', performConversion);
}

// -------------------- INIT --------------------

function init() {
    updateSelectors();
    setupInputControl();
    applyDefaults();
    setupNav();
    setupSwap();
    performConversion();
}

init();