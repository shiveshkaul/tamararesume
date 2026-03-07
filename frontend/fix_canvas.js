const fs = require('fs');
const path = './src/components/ResumeCanvas.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/<img src="data:image\/jpeg;base64,[^"]+"/g, '<img src="/profile.jpeg"');
fs.writeFileSync(path, content);
