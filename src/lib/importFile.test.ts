import { describe, it, expect } from 'vitest'
import { convertFile, textToHtml, markdownToHtml, titleFromFilename } from './importFile'

describe('textToHtml', () => {
  it('splits paragraphs on blank lines and keeps single line breaks', () => {
    expect(textToHtml('Hello\nworld\n\nSecond para')).toBe('<p>Hello<br>world</p><p>Second para</p>')
  })
  it('escapes HTML so uploaded text cannot inject markup', () => {
    expect(textToHtml('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
  })
})

describe('markdownToHtml', () => {
  it('converts headings, emphasis and lists', () => {
    const html = markdownToHtml('# Title\n\n**bold** and *it*\n\n- a\n- b\n\n1. one')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>it</em>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<ol>')
  })
  it('does not render raw HTML blocks', () => {
    expect(markdownToHtml('<img src=x onerror=alert(1)>')).not.toContain('<img')
  })
})

describe('convertFile', () => {
  it('uses the filename (without extension) as the title', () => {
    expect(convertFile('Meeting notes.md', 10, '# Hi').title).toBe('Meeting notes')
    expect(titleFromFilename('.md')).toBe('Imported document')
  })
  it('rejects unsupported, empty and oversized files with clear messages', () => {
    expect(() => convertFile('report.pdf', 10, 'x')).toThrow(/Unsupported file type ".pdf"/)
    expect(() => convertFile('a.txt', 10, '   ')).toThrow('File is empty')
    expect(() => convertFile('a.txt', 2 * 1024 * 1024, 'x')).toThrow('larger than 1 MB')
  })
})
