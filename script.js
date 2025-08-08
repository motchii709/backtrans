async function translate(text, from, to) {
  const res = await fetch("https://translate.argosopentech.com/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: from, target: to, format: "text" }),
  });

  const data = await res.json();
  return data.translatedText;
}

document.getElementById("translateBtn").addEventListener("click", async () => {
  const inputText = document.getElementById("inputText").value;
  if (!inputText.trim()) return;

  const steps = [];
  let text = inputText;

  const langs = [
    ["ja", "ug"], // ウイグル語
    ["ug", "la"], // ラテン語
    ["la", "ky"], // キルギス語
    ["ky", "xh"], // コーサ語
    ["xh", "ko"], // 韓国語
    ["ko", "ja"], // 日本語に戻す
  ];

  for (const [from, to] of langs) {
    const nextText = await translate(text, from, to);
    steps.push({ from, to, text: nextText });
    text = nextText;
  }

  document.getElementById("finalOutput").innerText = text;

  const stepHTML = steps
    .map((step, i) => {
      return `➡️ ${step.from.toUpperCase()} → ${step.to.toUpperCase()}:\n${step.text}\n`;
    })
    .join("\n\n");

  document.getElementById("stepsOutput").innerText = stepHTML;
});
