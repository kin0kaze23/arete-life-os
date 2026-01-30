# Cost Approvals

Each non-empty line is treated as a regex matched against:

"<file>: <line>"

Use this to approve known cost-neutral additions without inline comments.

## Approved Snapshot (2026-01-30)

^ai/geminiService\.ts:\ callGemini\($
^api/gemini\.ts:\ ai\.models\.generateContent\(\{$
^api/gemini\.ts:\ const\ callGemini\ =\ async\ \(model:\ string\)\ =>\ \{$
^api/gemini\.ts:\ const\ callOpenAI\ =\ async\ \(input:\ string,\ options\?:\ \{\ json\?:\ boolean;\ label\?:\ string\ \}\)\ =>\ \{$
^api/gemini\.ts:\ const\ fallbackText\ =\ await\ modelRouter\.generateText\('askAura',\ finalPrompt\);$
^api/gemini\.ts:\ const\ fallback\ =\ await\ modelRouter\.generateJSON\('generateEventPrepPlan',\ prompt\);$
^api/gemini\.ts:\ const\ parsed\ =\ await\ modelRouter\.generateJSON\('generateBlindSpots',\ finalPrompt\);$
^api/gemini\.ts:\ const\ parsed\ =\ await\ modelRouter\.generateJSON\('generateInsights',\ finalPrompt\);$
^api/gemini\.ts:\ const\ parsed\ =\ await\ modelRouter\.generateJSON\('generateTasks',\ finalPrompt\);$
^api/gemini\.ts:\ const\ result\ =\ await\ modelRouter\.generateJSON\('dailyIntelligenceBatch',\ finalPrompt\);$
^api/gemini\.ts:\ const\ result\ =\ await\ modelRouter\.generateJSON\('generateDailyPlan',\ finalPrompt\);$
^api/gemini\.ts:\ const\ result\ =\ await\ modelRouter\.generateJSON\('generateDeepTasks',\ finalPrompt\);$
^api/gemini\.ts:\ const\ result\ =\ await\ modelRouter\.generateWithSearch\('generateEventPrepPlan',\ prompt\);$
^api/gemini\.ts:\ const\ result\ =\ await\ modelRouter\.generateWithSearch\('generateInsights',\ finalPrompt\);$
^api/gemini\.ts:\ const\ textResult\ =\ await\ callOpenAI\(finalPrompt,\ \{\ label:\ 'askAura'\ \}\);$
^api/gemini\.ts:\ const\ textResult\ =\ await\ callOpenAI\(prompt,\ \{\ label:\ 'generateDeepInitialization'\ \}\);$
^api/gemini\.ts:\ const\ textResult\ =\ await\ callOpenAI\(toJsonPrompt\(finalPrompt\),\ \{$
^api/gemini\.ts:\ const\ textResult\ =\ await\ callOpenAI\(toJsonPrompt\(prompt\),\ \{$
^api/gemini\.ts:\ const\ text\ =\ await\ callGemini\(model\);$
^api/gemini\.ts:\ return\ await\ modelRouter\.generateJSON\('generateDeepInitialization',\ prompt\);$
^api/gemini\.ts:\ return\ await\ modelRouter\.generateWithSearch\('askAura',\ finalPrompt\);$
