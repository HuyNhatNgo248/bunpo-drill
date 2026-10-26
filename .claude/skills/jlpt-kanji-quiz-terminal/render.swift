import PDFKit
import AppKit
let a = CommandLine.arguments
let doc = PDFDocument(url: URL(fileURLWithPath: a[1]))!
let out = a[2]
for n in a[3].split(separator: ",").compactMap({ Int($0) }) where n >= 1 && n <= doc.pageCount {
  let p = doc.page(at: n-1)!
  let r = p.bounds(for: .mediaBox)
  let s: CGFloat = 1400 / max(r.width, r.height)
  let img = NSImage(size: NSSize(width: r.width*s, height: r.height*s))
  img.lockFocus()
  NSColor.white.set(); NSRect(origin: .zero, size: img.size).fill()
  let ctx = NSGraphicsContext.current!.cgContext
  ctx.scaleBy(x: s, y: s)
  p.draw(with: .mediaBox, to: ctx)
  img.unlockFocus()
  let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
  try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.7])!.write(to: URL(fileURLWithPath: "\(out)-\(n).jpg"))
}
