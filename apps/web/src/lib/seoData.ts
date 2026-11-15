import { ToolSeoData, RelatedToolItem, FaqItem } from "@/components/ToolSeoSection";

const ALL_TOOLS_CATALOG: Record<string, RelatedToolItem> = {
  merge: {
    id: "merge",
    name: "Merge PDF",
    description: "Combine multiple PDF documents into a single unified file in your preferred order.",
    href: "/merge/",
    iconSrc: "/icons/tool-merge.png",
  },
  split: {
    id: "split",
    name: "Split PDF",
    description: "Extract specific page ranges, extract single sheets, or burst each page into standalone files.",
    href: "/split/",
    iconSrc: "/icons/tool-split.png",
  },
  rotate: {
    id: "rotate",
    name: "Rotate PDF",
    description: "Rotate document pages by 90, 180, or 270 degrees with persistent orientation preservation.",
    href: "/rotate/",
    iconSrc: "/icons/tool-rotate.png",
  },
  reorder: {
    id: "reorder",
    name: "Reorder Pages",
    description: "Visually resequence document pages via client-side preview and drag-and-drop orchestration.",
    href: "/reorder/",
    iconSrc: "/icons/tool-reorder.png",
  },
  remove: {
    id: "remove",
    name: "Remove Pages",
    description: "Delete unwanted pages or confidential sheets from your document before sharing.",
    href: "/remove/",
    iconSrc: "/icons/tool-remove.png",
  },
};

export const MERGE_SEO_DATA: ToolSeoData = {
  toolId: "merge",
  toolName: "Merge PDF Files Online",
  tagline: "Combine multiple PDF documents into a single unified file with custom sequencing",
  summary:
    "Combine multiple PDF documents into one organized file. Arrange files in custom order, preview page sequences, and merge locally in your browser with zero server uploads.",
  howToSteps: [
    {
      step: 1,
      title: "Select or Drop PDF Files",
      description:
        "Choose two or more PDF documents from your computer or mobile device. PDFKarlo supports files up to 50 MB each.",
    },
    {
      step: 2,
      title: "Arrange Document & Page Order",
      description:
        "Switch between Unified Page Sequence view or Document Grouping. Use up and down controls to set the exact file sequence.",
    },
    {
      step: 3,
      title: "Merge In-Browser Privately",
      description:
        "Click 'Merge PDFs'. The client-side Web Worker engine processes the files locally in your device RAM without uploading data.",
    },
    {
      step: 4,
      title: "Download Unified PDF",
      description:
        "Your merged document is ready instantly. Click Download to save the clean, merged PDF directly to your downloads folder.",
    },
  ],
  technicalDetails: {
    heading: "How PDFKarlo Merges PDFs Locally in Your Browser",
    paragraphs: [
      "Traditional online PDF mergers upload your sensitive documents to remote cloud servers, exposing contracts, tax forms, and bank statements to potential data breaches and third-party logging. PDFKarlo runs on an entirely client-side architecture powered by modern WebAssembly and Web Worker threads.",
      "When you add PDF files to PDFKarlo, they are read directly into browser memory as ArrayBuffers using the standard HTML5 FileReader API. The pdf-lib engine extracts the native page dictionaries, content streams, and embedded vector resources from each document, combining them into a pristine new PDF document without converting pages into lossy images.",
      "Because zero bytes are uploaded across the internet, there is no bandwidth delay, no waiting in remote server queues, and no risk of your files lingering in a remote database or cloud storage bucket. Your confidential documents remain strictly inside your browser sandbox.",
    ],
  },
  useCases: [
    {
      tag: "Business & Legal",
      title: "Assembling Contracts & Annexures",
      description:
        "Combine primary master service agreements with exhibits, scope-of-work schedules, and signature pages into one comprehensive PDF packet for clients.",
    },
    {
      tag: "Financial & Tax",
      title: "Organizing Tax Documents & Receipts",
      description:
        "Merge annual tax returns, 1099/W2 statements, expense spreadsheets, and receipts into a single organized dossier for your accountant.",
    },
    {
      tag: "Academic & Study",
      title: "Consolidating Lecture Notes & Papers",
      description:
        "Join individual chapter readings, professor lecture slides, and research bibliography sheets into a complete, easy-to-read textbook or revision binder.",
    },
  ],
  specifications: {
    maxFileSize: "50 MB per file",
    engine: "pdf-lib & isolated Web Workers",
    privacy: "100% In-Browser (0 bytes uploaded)",
    outputFormat: "Standard Vector PDF (.pdf)",
    browserSupport: "Chrome, Edge, Safari, Firefox, Opera",
  },
  faqs: [
    {
      question: "Is PDFKarlo's PDF merger really 100% free?",
      answer:
        "Yes, PDFKarlo is completely free. We do not charge subscriptions, require credit cards, or enforce daily usage paywalls. All 5 core tools are free to use.",
    },
    {
      question: "Are my confidential PDF files uploaded to your servers?",
      answer:
        "No. Unlike other websites, PDFKarlo processes your documents entirely within your local browser memory using client-side Web Workers. Your files never touch our servers, are never logged, and are wiped the moment you close the browser tab.",
    },
    {
      question: "Can I rearrange the order of documents before merging?",
      answer:
        "Yes. In the Document Group view, use the Move Up and Move Down arrow buttons to set your exact desired file sequence before clicking Merge.",
    },
    {
      question: "What is the maximum supported PDF file size?",
      answer:
        "PDFKarlo supports files up to 50 MB per file. This limit is designed to ensure smooth, responsive memory allocation within your browser without causing tab crashes.",
    },
    {
      question: "Can I merge password-protected PDFs?",
      answer:
        "If a PDF is password-protected, PDFKarlo's magic-byte inspection detects the encryption and prompts you to unlock the document before merging. For security reasons, encrypted files cannot be combined until decrypted.",
    },
    {
      question: "PDF kaise merge kare (How to merge in Hindi)?",
      answer:
        "PDFKarlo par PDF merge karna bahut aasan hai: 'Select PDF files' par click karke apne 2 ya usse zyada PDF documents choose karein, unka order arrange karein, aur 'Merge' button dabayein. Kuch hi seconds mein aapka combined PDF download ke liye ready ho jayega — wo bhi bina kisi server upload ke aur 100% free.",
    },
  ],
  relatedTools: [
    ALL_TOOLS_CATALOG.split,
    ALL_TOOLS_CATALOG.rotate,
    ALL_TOOLS_CATALOG.reorder,
    ALL_TOOLS_CATALOG.remove,
  ],
};

export const SPLIT_SEO_DATA: ToolSeoData = {
  toolId: "split",
  toolName: "Split PDF Files Online",
  tagline: "Extract specific page ranges, pull individual pages, or burst documents into separate files",
  summary:
    "Split large PDF documents into smaller parts. Extract custom page ranges (e.g. 1-4, 5-10), pick individual pages, or burst every single sheet into standalone files inside a ZIP archive.",
  howToSteps: [
    {
      step: 1,
      title: "Upload Your PDF Document",
      description:
        "Choose any PDF document up to 50 MB from your device. PDFKarlo renders real-time page thumbnails in your browser.",
    },
    {
      step: 2,
      title: "Select Your Split Mode",
      description:
        "Choose 'Split by Ranges' for multi-part division, 'Extract Pages' to select specific sheets, or 'Burst Mode' to split all pages.",
    },
    {
      step: 3,
      title: "Configure Ranges or Pages",
      description:
        "Type your target page numbers or click on page preview thumbnails. Live badges verify the exact pages included in each split part.",
    },
    {
      step: 4,
      title: "Extract & Download Instantly",
      description:
        "Click 'Split PDF'. Your extracted PDF files or ZIP package will be generated locally in browser RAM for immediate download.",
    },
  ],
  technicalDetails: {
    heading: "Precise Page Extraction Without Quality Degradation",
    paragraphs: [
      "Splitting a PDF requires navigating the document's internal cross-reference table and page tree hierarchy. Lesser online tools convert pages to low-resolution JPEG images, re-assembling them into blurry documents with lost text selection and broken hyperlinks.",
      "PDFKarlo operates directly on the underlying PDF stream objects. Our client engine copies exact page objects, font descriptors, and vector coordinate matrices into the target output files. Text remains sharp, searchable, and crystal-clear at any zoom level.",
      "When using Burst Mode or multi-part splitting, PDFKarlo uses JSZip to bundle the generated documents into a clean, organized ZIP archive directly in your browser memory, eliminating upload bandwidth delays completely.",
    ],
  },
  useCases: [
    {
      tag: "Legal Practice",
      title: "Extracting Signed Execution Pages",
      description:
        "Pull out just the notarized signature and acknowledgment pages from a 100-page loan agreement or deed without sharing the entire confidential file.",
    },
    {
      tag: "Publishing & Education",
      title: "Splitting E-Books & Syllabi into Chapters",
      description:
        "Divide massive 500-page textbooks or comprehensive course syllabi into weekly reading modules for students and study groups.",
    },
    {
      tag: "Enterprise HR",
      title: "Partitioning Bulk Employee Reports",
      description:
        "Split concatenated payroll runs, performance reviews, or quarterly department statements into individual files for distribution.",
    },
  ],
  specifications: {
    maxFileSize: "50 MB per file",
    engine: "pdf-lib, JSZip & Web Workers",
    privacy: "100% In-Browser (0 bytes uploaded)",
    outputFormat: "Individual PDFs (.pdf) or ZIP Archive (.zip)",
    browserSupport: "Chrome, Edge, Safari, Firefox, Opera",
  },
  faqs: [
    {
      question: "Can I split a PDF by custom page ranges?",
      answer:
        "Yes. In 'Split by Ranges' mode, you can specify custom intervals like '1-3' and '4-8'. Each range is validated in real-time and exported as a distinct document.",
    },
    {
      question: "What is Burst Mode?",
      answer:
        "Burst Mode splits every single page of your PDF into an individual, numbered PDF document (e.g., page-1.pdf, page-2.pdf) and bundles them into an instant ZIP download.",
    },
    {
      question: "Does splitting a PDF reduce its visual quality?",
      answer:
        "No. PDFKarlo copies vector objects and font tables losslessly. All text remains sharp and selectable, and image quality is 100% preserved.",
    },
    {
      question: "Are my documents kept private during splitting?",
      answer:
        "Yes, absolutely. The splitting algorithm runs locally on your machine using Web Workers. No file data is sent to any server.",
    },
    {
      question: "PDF kaise split kare (How to split in Hindi)?",
      answer:
        "PDFKarlo par PDF split karne ke liye: apna PDF upload karein, 'Split by Ranges' ya 'Extract Pages' chunein, page numbers select karein, aur Split button par click karein. Files turant aapke browser me bina kisi upload ke alag ho jayengi.",
    },
  ],
  relatedTools: [
    ALL_TOOLS_CATALOG.merge,
    ALL_TOOLS_CATALOG.remove,
    ALL_TOOLS_CATALOG.reorder,
    ALL_TOOLS_CATALOG.rotate,
  ],
};

export const ROTATE_SEO_DATA: ToolSeoData = {
  toolId: "rotate",
  toolName: "Rotate PDF Pages Online",
  tagline: "Permanently fix PDF page orientation by 90, 180, or 270 degrees with live visual preview",
  summary:
    "Rotate upside-down or sideways PDF pages online for free. Adjust individual pages or rotate all pages simultaneously clockwise or counterclockwise with permanent orientation preservation.",
  howToSteps: [
    {
      step: 1,
      title: "Choose PDF Document",
      description:
        "Select your PDF file (up to 50 MB). Real-time thumbnails will render locally for every page in your document.",
    },
    {
      step: 2,
      title: "Rotate Individual or All Pages",
      description:
        "Use the dedicated +90° (Clockwise) or -90° (Counterclockwise) buttons on each thumbnail card, or click 'Rotate All'.",
    },
    {
      step: 3,
      title: "Inspect in High-Resolution Modal",
      description:
        "Click the zoom icon on any page to open a full-resolution preview and verify that fine print, tables, and charts are upright.",
    },
    {
      step: 4,
      title: "Save Permanent Orientation",
      description:
        "Click 'Apply & Download'. PDFKarlo permanently updates the PDF rotation dictionaries in memory and exports your file.",
    },
  ],
  technicalDetails: {
    heading: "Permanent Orientation Preservation in PDF Specifications",
    paragraphs: [
      "In standard PDF document architecture, each page dictionary contains an optional `/Rotate` entry specifying a clockwise rotation in multiples of 90 degrees (0, 90, 180, 270). Many viewer apps only temporarily rotate pages in memory during a single reading session without saving the change back to the file.",
      "PDFKarlo permanently rewrites the page dictionary tags directly in the document catalog. When you rotate a page with PDFKarlo, the orientation is permanently preserved across Adobe Acrobat, Apple Preview, Google Chrome, web browsers, and physical printers.",
      "Furthermore, because our engine modifies vector rotation metadata rather than re-rasterizing the underlying page pixels, document file sizes remain lean and typography retains 100% vector sharpness.",
    ],
  },
  useCases: [
    {
      tag: "Scans & Documentation",
      title: "Fixing Sideways Mobile Camera Scans",
      description:
        "Correct receipts, invoices, and IDs photographed sideways or upside-down so they read properly in tax software and HR records.",
    },
    {
      tag: "Engineering & Architecture",
      title: "Reorienting Wide Blueprints & CAD Drawings",
      description:
        "Rotate landscape architectural elevations and electrical schematics embedded inside predominantly portrait specification manuals.",
    },
    {
      tag: "Print & Publishing",
      title: "Preparing Multi-Page Documents for Print",
      description:
        "Ensure uniform page orientation across all sheets before sending files to commercial print shops or office binding machines.",
    },
  ],
  specifications: {
    maxFileSize: "50 MB per file",
    engine: "pdf-lib & Web Workers",
    privacy: "100% In-Browser (0 bytes uploaded)",
    outputFormat: "Standard Vector PDF (.pdf)",
    browserSupport: "Chrome, Edge, Safari, Firefox, Opera",
  },
  faqs: [
    {
      question: "Can I rotate just one page instead of the whole PDF?",
      answer:
        "Yes! PDFKarlo provides dedicated +90° and -90° rotation buttons on every individual page thumbnail, allowing you to rotate single pages independently.",
    },
    {
      question: "Is the rotation permanent when I open the PDF elsewhere?",
      answer:
        "Yes. PDFKarlo writes standard `/Rotate` entries into the PDF binary metadata. The rotation is permanent across Adobe Acrobat, Chrome, Apple Preview, and print drivers.",
    },
    {
      question: "Will rotating a page reduce its text or image sharpness?",
      answer:
        "No. Rotation modifies document metadata coordinates and does not re-compress images or re-rasterize vector typography. Quality remains 100% identical.",
    },
    {
      question: "What is the file size limit for rotating PDFs?",
      answer:
        "You can rotate PDF files up to 50 MB per file directly in your browser without any upload lag.",
    },
    {
      question: "PDF rotate kaise kare (How to rotate in Hindi)?",
      answer:
        "PDFKarlo par PDF rotate karna behad aasan hai: file upload karein, jis page ko rotate karna ho uspar bane rotate icon (+90° ya -90°) par click karein, aur 'Apply & Download' par click karke save kar lein.",
    },
  ],
  relatedTools: [
    ALL_TOOLS_CATALOG.reorder,
    ALL_TOOLS_CATALOG.remove,
    ALL_TOOLS_CATALOG.merge,
    ALL_TOOLS_CATALOG.split,
  ],
};

export const REORDER_SEO_DATA: ToolSeoData = {
  toolId: "reorder",
  toolName: "Reorder PDF Pages Online",
  tagline: "Rearrange, sort, or reverse PDF page sequences visually with intuitive drag and drop",
  summary:
    "Visually change the order of pages in any PDF document. Drag and drop thumbnails, move pages to start or end, reverse the whole document, and export your reorganised PDF with zero server uploads.",
  howToSteps: [
    {
      step: 1,
      title: "Add PDF Document",
      description:
        "Select your PDF file (up to 50 MB). Real-time thumbnails will render locally so you can see every page clearly.",
    },
    {
      step: 2,
      title: "Drag & Drop into New Sequence",
      description:
        "Click and drag any page thumbnail to its new position, or use the quick position arrow buttons (Move to Start, Left, Right, End).",
    },
    {
      step: 3,
      title: "Utilize Instant Reordering Tools",
      description:
        "Need to flip the entire document? Use 'Reverse Order' with one click, or click 'Reset to Original' to undo changes.",
    },
    {
      step: 4,
      title: "Export Reordered PDF",
      description:
        "Click 'Apply & Download'. The client-side Web Worker compiles the new page sequence into a clean PDF ready for download.",
    },
  ],
  technicalDetails: {
    heading: "Client-Side Page Tree Re-indexing with Zero Quality Loss",
    paragraphs: [
      "In PDF documents, page sequences are defined by an indexed array inside the document's central `/Pages` tree. Reordering pages manually in traditional desktop software often requires costly licenses or cumbersome export procedures.",
      "PDFKarlo provides an intuitive visual drag-and-drop workspace powered by HTML5 drag events and live canvas rendering. When you move a page, PDFKarlo adjusts the page reference pointers in browser memory.",
      "Because document compilation runs locally using `pdf-lib` inside a Web Worker, all original vector artwork, annotations, hyperlinks, and form fields remain intact with zero compression artifacts.",
    ],
  },
  useCases: [
    {
      tag: "Office Administration",
      title: "Fixing Scanner Feeder Misorders",
      description:
        "Rearrange documents scanned out of sequence or double-sided sheets fed in reverse order by automatic document feeders.",
    },
    {
      tag: "Creative & Design",
      title: "Reorganizing Portfolios & Slide Decks",
      description:
        "Fine-tune the narrative flow of pitch decks, design portfolios, and case studies before sharing them with prospective clients.",
    },
    {
      tag: "Academic Publishing",
      title: "Structuring Theses & Research Papers",
      description:
        "Position title pages, abstracts, tables of contents, methodology chapters, and appendices in the exact mandatory institutional sequence.",
    },
  ],
  specifications: {
    maxFileSize: "50 MB per file",
    engine: "pdf-lib & Web Workers",
    privacy: "100% In-Browser (0 bytes uploaded)",
    outputFormat: "Standard Vector PDF (.pdf)",
    browserSupport: "Chrome, Edge, Safari, Firefox, Opera",
  },
  faqs: [
    {
      question: "How do I rearrange pages in my PDF?",
      answer:
        "Simply drag and drop the page preview cards into your preferred sequence, or use the card position controls (Move to Start, Move Left, Move Right, Move to End).",
    },
    {
      question: "Can I reverse the entire page order with one click?",
      answer:
        "Yes! PDFKarlo has a dedicated 'Reverse Order' button that instantly flips your document from back-to-front, ideal for reversing upside-down scanner outputs.",
    },
    {
      question: "Will moving pages affect fonts or links?",
      answer:
        "No. PDFKarlo re-indexes the native page pointers without re-encoding page content. Fonts, vector shapes, and hyperlinks remain intact.",
    },
    {
      question: "What is the maximum file size for reordering?",
      answer:
        "PDFKarlo supports PDF files up to 50 MB per file directly within client memory.",
    },
    {
      question: "PDF page order kaise change kare (How to reorder in Hindi)?",
      answer:
        "PDFKarlo par PDF upload karein, pages ko drag karke apni marzi ke sequence me lagayein, aur 'Apply & Download' par click karke naya PDF download kar lein.",
    },
  ],
  relatedTools: [
    ALL_TOOLS_CATALOG.remove,
    ALL_TOOLS_CATALOG.rotate,
    ALL_TOOLS_CATALOG.merge,
    ALL_TOOLS_CATALOG.split,
  ],
};

export const REMOVE_SEO_DATA: ToolSeoData = {
  toolId: "remove",
  toolName: "Remove PDF Pages Online Free",
  tagline: "Delete unwanted, blank, or confidential pages from PDF documents with instant preview",
  summary:
    "Delete unwanted or confidential pages from any PDF document. Click pages to mark for deletion, specify custom page ranges, and download a clean, pruned PDF with zero server uploads.",
  howToSteps: [
    {
      step: 1,
      title: "Upload PDF File",
      description:
        "Select your PDF document (up to 50 MB). Live visual thumbnails will be generated for every page in your file.",
    },
    {
      step: 2,
      title: "Mark Pages for Deletion",
      description:
        "Click on any page thumbnail to flag it with a red deletion overlay, or type a page range (e.g. 2-5, 8) in the quick selection bar.",
    },
    {
      step: 3,
      title: "Verify Retained Pages",
      description:
        "A live summary shows the exact number of pages remaining. Our built-in safeguard prevents accidental deletion of all pages.",
    },
    {
      step: 4,
      title: "Download Cleaned PDF",
      description:
        "Click 'Remove Pages'. The client-side Web Worker strips out the deleted streams and compiles your streamlined PDF.",
    },
  ],
  technicalDetails: {
    heading: "Clean Object Pruning and Confidential Data Removal",
    paragraphs: [
      "Simply hiding a page in a PDF viewer does not remove its underlying text, images, or metadata from the document file. If confidential data remains in orphaned object dictionaries, sensitive information can be recovered by tech-savvy third parties.",
      "PDFKarlo uses `pdf-lib` to completely exclude marked pages from the newly compiled PDF document catalog. Excluded page streams, font subsets, and associated annotations are omitted from the output cross-reference table, ensuring permanent deletion.",
      "Because all document manipulation runs inside your browser sandbox, confidential sheets never leave your device, giving you complete data privacy for legal contracts, medical charts, and financial filings.",
    ],
  },
  useCases: [
    {
      tag: "Document Cleanup",
      title: "Deleting Blank Scanner Sheets",
      description:
        "Strip out trailing blank pages and accidental empty scans generated by automatic multi-page office scanners.",
    },
    {
      tag: "Privacy & Confidentiality",
      title: "Removing Sensitive Pricing & Vendor Sheets",
      description:
        "Remove internal wholesale pricing sheets, confidential partner terms, or executive signatures before emailing proposals to prospects.",
    },
    {
      tag: "Email & File Optimization",
      title: "Pruning Heavy Unneeded Pages",
      description:
        "Delete bulky appendix sections and high-resolution cover photos to reduce document size before attaching to email.",
    },
  ],
  specifications: {
    maxFileSize: "50 MB per file",
    engine: "pdf-lib & Web Workers",
    privacy: "100% In-Browser (0 bytes uploaded)",
    outputFormat: "Standard Vector PDF (.pdf)",
    browserSupport: "Chrome, Edge, Safari, Firefox, Opera",
  },
  faqs: [
    {
      question: "How do I remove specific pages from a PDF?",
      answer:
        "Click on the page thumbnails you wish to delete (they will show a red trash badge and semi-transparent overlay) or type a range like '2-4' in the selection box, then click 'Remove Pages'.",
    },
    {
      question: "Can I accidentally delete all pages from my PDF?",
      answer:
        "No. PDFKarlo includes an automatic safeguard that disables deletion if all pages are selected, ensuring you always retain at least one valid page.",
    },
    {
      question: "Are removed pages permanently deleted?",
      answer:
        "Yes. PDFKarlo compiles a new PDF that excludes the discarded page streams entirely. The data cannot be recovered from the exported document.",
    },
    {
      question: "Is there any cost or subscription to remove PDF pages?",
      answer:
        "No. Removing PDF pages on PDFKarlo is 100% free with no account registration and no watermark.",
    },
    {
      question: "PDF se pages kaise delete kare (How to delete pages in Hindi)?",
      answer:
        "PDFKarlo par PDF upload karein, jin pages ko hatana ho un par click karke select karein (red mark lag jayega), aur 'Remove Pages' par click karein. Aapka clean PDF turant download ho jayega.",
    },
  ],
  relatedTools: [
    ALL_TOOLS_CATALOG.split,
    ALL_TOOLS_CATALOG.reorder,
    ALL_TOOLS_CATALOG.rotate,
    ALL_TOOLS_CATALOG.merge,
  ],
};

export const HOMEPAGE_FAQS: FaqItem[] = [
  {
    question: "What is PDFKarlo?",
    answer:
      "PDFKarlo is a free, privacy-first online PDF utility platform. It provides essential tools to merge, split, rotate, reorder, and remove PDF pages directly inside your web browser without uploading documents to remote processing servers.",
  },
  {
    question: "Are all tools on PDFKarlo really free to use?",
    answer:
      "Yes. All 5 currently live PDF tools on PDFKarlo are completely free. There are no subscriptions, no credit card requirements, no paywalls, and no watermarks added to your exported files.",
  },
  {
    question: "How is PDFKarlo different from traditional online PDF editors?",
    answer:
      "Traditional online PDF tools upload your confidential documents (contracts, financial records, medical forms) to external cloud servers. PDFKarlo operates on an entirely client-side architecture using WebAssembly and Web Worker threads. Your PDF files are processed directly in your device's memory and never leave your machine.",
  },
  {
    question: "What is the maximum PDF file size supported?",
    answer:
      "PDFKarlo supports PDF files up to 50 MB per file. This limit is intentionally configured to guarantee fast, responsive memory allocation directly inside your browser without causing browser tabs to crash.",
  },
  {
    question: "Do I need to create an account or install any software?",
    answer:
      "No account, email signup, or software installation is required. PDFKarlo runs instantly in any modern web browser on desktop, laptop, tablet, or mobile phone.",
  },
  {
    question: "Can I use PDFKarlo on my mobile phone (Android / iPhone)?",
    answer:
      "Yes. PDFKarlo is fully mobile-responsive and works seamlessly on mobile web browsers including Google Chrome, Apple Safari, Samsung Internet, and Firefox.",
  },
  {
    question: "PDF ka kaam online bina signup ke kaise kare (Conversational search)?",
    answer:
      "PDFKarlo ke saath aap bina kisi account ya signup ke apne PDF documents ko merge, split, rotate, reorder aur clean kar sakte hain. Bas tool choose karein, file select karein, aur turant processed PDF download karein — 100% free aur secure.",
  },
];

