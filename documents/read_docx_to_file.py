import zipfile
import xml.etree.ElementTree as ET

file_path = r'c:\Users\Admin\Documents\NP-Education--main\NP-Education--main\documents\User story Sprint 2 .docx'
with zipfile.ZipFile(file_path) as docx:
    content = docx.read('word/document.xml')
    tree = ET.fromstring(content)
    texts = [x.text for x in tree.iter() if x.text]
    
with open('temp_story.txt', 'w', encoding='utf-8') as f:
    for t in texts:
        f.write(t + '\n')
