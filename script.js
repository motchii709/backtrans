document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language-select');
    const addLanguageButton = document.getElementById('add-language-button');
    const selectedLanguagesChipSet = document.getElementById('selected-languages');
    const sourceTextField = document.getElementById('source-text');
    const translateButton = document.getElementById('translate-button');
    const outputSection = document.getElementById('output-section');
    const loadingIndicator = document.getElementById('loading-indicator');

    // 1. Populate the language dropdown
    if (window.supportedLanguages) {
        supportedLanguages.forEach(lang => {
            if (lang.code !== 'ja') { // Cannot select Japanese as an intermediate language
                const option = document.createElement('md-select-option');
                option.value = lang.code;
                option.innerHTML = `<div slot="headline">${lang.name}</div>`;
                languageSelect.appendChild(option);
            }
        });
    } else {
        console.error('supportedLanguages array not found. Make sure langs.js is loaded.');
    }

    // 2. Add language to the chip set
    addLanguageButton.addEventListener('click', () => {
        const selectedCode = languageSelect.value;
        if (!selectedCode) return;

        const lang = supportedLanguages.find(l => l.code === selectedCode);
        if (!lang) return;

        // Prevent adding duplicates
        const existingChips = selectedLanguagesChipSet.querySelectorAll('md-input-chip');
        const isAlreadyAdded = Array.from(existingChips).some(chip => chip.dataset.code === selectedCode);
        if (isAlreadyAdded) {
            // Maybe show a toast or message later
            console.warn(`Language ${selectedCode} is already added.`);
            return;
        }

        const chip = document.createElement('md-input-chip');
        chip.label = lang.name;
        chip.dataset.code = lang.code;
        chip.removable = true;

        selectedLanguagesChipSet.appendChild(chip);

        // Reset select
        languageSelect.value = '';
    });

    // 3. Handle chip removal
    // The `remove` event on a chip bubbles up to the chip set.
    selectedLanguagesChipSet.addEventListener('remove', (e) => {
        // The chip is automatically removed from the DOM by the component.
        // No extra JS needed to remove it.
        console.log(`Removed chip:`, e.target);
    });

    // --- Translation Logic ---

    const API_URL = 'https://translate.argosopentech.com/translate';

    async function callTranslateAPI(text, source, target) {
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    q: text,
                    source: source,
                    target: target,
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const errorBody = await res.text();
                throw new Error(`API Error: ${res.status} ${res.statusText}. Body: ${errorBody}`);
            }

            const data = await res.json();
            return data.translatedText;
        } catch (error) {
            console.error(`Translation failed from ${source} to ${target}:`, error);
            // Re-throw the error to be caught by the main process
            throw error;
        }
    }

    function getLangName(code) {
        const lang = supportedLanguages.find(l => l.code === code);
        return lang ? lang.name : code.toUpperCase();
    }

    function renderResults(results) {
        // Final Result Card (most important)
        const finalResult = results[results.length - 1];
        const finalCard = document.createElement('md-elevated-card');
        finalCard.id = 'final-result-card';
        finalCard.innerHTML = `
            <div class="card-content">
                <h2>最終翻訳結果（${getLangName(finalResult.sourceLang)} → ${getLangName(finalResult.targetLang)}）</h2>
                <p class="final-text">${finalResult.translatedText}</p>
            </div>
        `;
        outputSection.appendChild(finalCard);

        // Intermediate Steps
        const detailsContainer = document.createElement('div');
        detailsContainer.id = 'intermediate-steps';
        detailsContainer.innerHTML = '<h3>翻訳の過程</h3>';

        results.forEach((result, index) => {
            const stepCard = document.createElement('md-elevated-card');
            stepCard.classList.add('step-card');
            stepCard.innerHTML = `
                <div class="card-content">
                    <h4>ステップ ${index + 1}: ${getLangName(result.sourceLang)} → ${getLangName(result.targetLang)}</h4>
                    <p>${result.translatedText}</p>
                </div>
            `;
            detailsContainer.appendChild(stepCard);
        });

        outputSection.appendChild(detailsContainer);
    }

    async function startTranslationProcess() {
        const sourceText = sourceTextField.value.trim();
        if (!sourceText) {
            // We'll add a proper UI message later
            alert('翻訳するテキストを入力してください。');
            return;
        }

        const chips = selectedLanguagesChipSet.querySelectorAll('md-input-chip');
        if (chips.length === 0) {
            alert('中間言語を1つ以上追加してください。');
            return;
        }

        const intermediateLangs = Array.from(chips).map(chip => chip.dataset.code);
        const translationChain = ['ja', ...intermediateLangs, 'ja'];

        // Clear previous results and show loading
        outputSection.innerHTML = '';
        loadingIndicator.style.display = 'block';
        translateButton.disabled = true;

        let currentText = sourceText;
        const results = [];

        try {
            for (let i = 0; i < translationChain.length - 1; i++) {
                const sourceLang = translationChain[i];
                const targetLang = translationChain[i + 1];

                // Placeholder for result rendering (will be done in the next step)
                console.log(`Translating from ${sourceLang} to ${targetLang}...`);

                const translatedText = await callTranslateAPI(currentText, sourceLang, targetLang);

                results.push({
                    sourceLang,
                    targetLang,
                    originalText: currentText,
                    translatedText
                });

                currentText = translatedText;
            }
            renderResults(results);

        } catch (error) {
            // Display error to the user
            const errorCard = document.createElement('md-elevated-card');
            errorCard.innerHTML = `
                <div style="padding: 16px; color: var(--md-sys-color-error);">
                    <h3>翻訳エラー</h3>
                    <p>翻訳中にエラーが発生しました。しばらくしてからもう一度お試しください。</p>
                    <p><small>${error.message}</small></p>
                </div>
            `;
            outputSection.appendChild(errorCard);
            console.error('An error occurred during the translation chain:', error);
        } finally {
            // Hide loading and re-enable button
            loadingIndicator.style.display = 'none';
            translateButton.disabled = false;
        }
    }

    translateButton.addEventListener('click', startTranslationProcess);
});
