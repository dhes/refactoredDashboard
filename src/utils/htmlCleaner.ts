export const cleanEscapedHtml = (escapedHtml: string): string => {
  return escapedHtml
    .replace(/\\"/g, '"')     // unescape double quotes
    .replace(/\\n/g, '\n')    // unescape newlines
    .replace(/\\t/g, '\t');   // unescape tabs
};

export const wrapHtmlForDisplay = (cleanHtml: string): string => {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Clause Coverage</title></head>
<body>
${cleanHtml}
</body>
</html>`;
};