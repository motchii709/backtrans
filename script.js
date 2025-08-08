// TODO: APIから動的に取得するように変更する
const AVAILABLE_LANGUAGES = [
    { code: "en", name: "英語" },
    { code: "es", name: "スペイン語" },
    { code: "fr", name: "フランス語" },
    { code: "de", name: "ドイツ語" },
    { code: "it", name: "イタリア語" },
    { code: "pt", name: "ポルトガル語" },
    { code: "ru", name: "ロシア語" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "韓国語" },
    { code: "zh", name: "中国語" },
    { code: "ar", name: "アラビア語" },
    { code: "hi", name: "ヒンディー語" },
    { code: "ug", name: "ウイグル語" },
    { code: "la", name: "ラテン語" },
    { code: "ky", name: "キルギス語" },
    { code: "xh", name: "コーサ語" },
];

const languageSelectorsContainer = document.getElementById("language-selectors");

function createLanguageSelector(selectedCode) {
    const select = document.createElement("md-outlined-select");
    select.label = "言語";

    AVAILABLE_LANGUAGES.forEach(lang => {
        const option = document.createElement("md-select-option");
        option.value = lang.code;
        option.innerText = lang.name;
        if (lang.code === selectedCode) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    languageSelectorsContainer.appendChild(select);
}

document.getElementById("addLangBtn").addEventListener("click", () => {
    createLanguageSelector(AVAILABLE_LANGUAGES[0].code);
});

document.getElementById("removeLangBtn").addEventListener("click", () => {
    if (languageSelectorsContainer.lastChild) {
        languageSelectorsContainer.removeChild(languageSelectorsContainer.lastChild);
    }
});


// 初期状態としていくつかのセレクターを設置
createLanguageSelector("ug");
createLanguageSelector("la");
createLanguageSelector("ky");


async function translate(text, from, to) {
  const res = await fetch("https://translate.argosopentech.com/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: from, target: to, format: "text" }),
  });

  if (!res.ok) {
      const error = await res.text();
      throw new Error(`翻訳APIエラー: ${res.status} ${error}`);
  }

  const data = await res.json();
  return data.translatedText;
}

document.getElementById("translateBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  if (!inputText.trim()) return;

  const steps = [];
  let text = inputText;
  let lastLang = "ja";

  const selectedLangs = [...languageSelectorsContainer.children].map(s => s.value);

  const langs = [];
  for (const langCode of selectedLangs) {
      langs.push([lastLang, langCode]);
      lastLang = langCode;
  }
  langs.push([lastLang, "ja"]); // 最後に日本語に戻す

  document.getElementById("finalOutput").innerText = "翻訳中...";
  document.getElementById("stepsOutput").innerText = "";

  try {
    for (const [from, to] of langs) {
      const nextText = await translate(text, from, to);
      steps.push({ from, to, text: nextText });
      text = nextText;

      //途中経過を表示
      const stepHTML = steps
        .map((step) => `➡️ ${step.from.toUpperCase()} → ${step.to.toUpperCase()}:\n${step.text}\n`)
        .join("\n\n");
      document.getElementById("stepsOutput").innerText = stepHTML;
    }

    document.getElementById("finalOutput").innerText = text;
  } catch (e) {
      console.error(e);
      document.getElementById("finalOutput").innerText = `エラーが発生しました：\n${e.message}`;
  }
});
