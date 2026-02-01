
import React, { useState, useEffect, useMemo } from 'react';

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

interface Header {
    level: number;
    text: string;
    id: string;
}

const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
        // Offset for sticky headers or comfort
        const headerOffset = 40;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
};

const ScrollspyNav: React.FC<{ sections: Header[]; activeSectionId: string | null }> = React.memo(({ sections, activeSectionId }) => {
    if (sections.length === 0) return null;
    return (
        <nav className="scrollspy-nav" aria-label="Report section navigation">
            {sections.map((section, index) => (
                <a 
                    key={section.id} 
                    href={`#${section.id}`} 
                    className="scrollspy-dot-link" 
                    aria-label={section.text === 'Table of Contents' ? 'Go to Table of Contents' : `Go to ${section.text} section`}
                    onClick={(e) => handleSmoothScroll(e, section.id)}
                >
                    <div className="scrollspy-tooltip">{section.text}</div>
                    <div 
                        className={`scrollspy-dot ${activeSectionId === section.id ? 'is-active' : ''}`} 
                        style={index === 0 && section.text === 'Table of Contents' ? { marginBottom: '8px' } : {}}
                    />
                </a>
            ))}
        </nav>
    );
});

const ReportDisplay: React.FC<{ markdownContent: string; reportId: number }> = ({ markdownContent, reportId }) => {
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    const { paginatedContent, mainSections } = useMemo(() => {
        // Helper to generate unique IDs per report to avoid conflicts
        const generateId = (text: string) => `report-${reportId}-${slugify(text)}`;

        // Initialize with Table of Contents as the first section for Scrollspy
        const localMainSections: Header[] = [
            { level: 2, text: 'Table of Contents', id: generateId('Table of Contents') }
        ];

        // 1. First Pass: Parse markdown to build a structured TOC (H2 and H3)
        // We replicate the PDF numbering logic here for consistency
        const tocItems: { level: number; text: string; id: string; displayTitle: string }[] = [];
        let h2Count = 0;
        let h3Count = 0;

        markdownContent.split('\n').forEach(line => {
            if (line.startsWith('## ') && !line.toLowerCase().includes('table of contents')) {
                // H2
                h2Count++;
                h3Count = 0;
                const rawText = line.substring(3).trim().replace(/\*\*/g, '');
                // Remove existing numbering if present to standardize
                const cleanText = rawText.replace(/^\d+\.?\d*\.?\s*/, '').trim();
                const id = generateId(cleanText);
                
                const displayTitle = `${h2Count}.0 ${cleanText}`;
                
                tocItems.push({ level: 2, text: cleanText, id, displayTitle });
                
                // Add to scrollspy (only H2s)
                if (cleanText.toLowerCase() !== 'appendix') {
                    localMainSections.push({ level: 2, text: cleanText, id });
                }
            } else if (line.startsWith('### ')) {
                // H3
                h3Count++;
                const rawText = line.substring(4).trim().replace(/\*\*/g, '');
                const cleanText = rawText.replace(/^\d+\.?\d*\.?\s*/, '').trim();
                const id = generateId(cleanText);
                
                const displayTitle = `${h2Count}.${h3Count} ${cleanText}`;
                
                tocItems.push({ level: 3, text: cleanText, id, displayTitle });
            }
        });

        // 2. Second Pass: Render Content
        const renderTable = (buffer: string[], key: string, isAppendix: boolean) => {
            if (buffer.length < 2) return null;
            const headers = buffer[0].split('|').slice(1, -1).map(h => h.trim());
            const bodyRows = buffer.slice(2);

            const TEXT_HEAVY_KEYWORDS = ['event', 'impact', 'description', 'risk', 'catalyst', 'thesis', 'overview', 'driver', 'context'];
            const isTextHeavy = headers.some(h => TEXT_HEAVY_KEYWORDS.some(kw => h.toLowerCase().includes(kw)));

            return (
                <div key={key} className={`overflow-x-auto ${isAppendix ? 'appendix-table-container' : ''}`}>
                    <table 
                        className={`min-w-full table-auto`}
                        style={isTextHeavy ? { fontSize: '0.875rem', lineHeight: '1.4' } : {}}
                    >
                        <thead>
                            <tr>
                                {headers.map((h, i) => <th key={i} dangerouslySetInnerHTML={{ __html: h.replace(/\*\*/g, '') }}></th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {bodyRows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.split('|').slice(1, -1).map((cell, cellIndex) => (
                                        <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        };

        const renderList = (buffer: React.ReactNode[], key: string, isToc: boolean) => (
            buffer.length > 0 ? <ul key={key} className={`my-4 p-0 ${isToc ? 'space-y-1 list-none' : 'space-y-2 pl-5'}`}>{buffer}</ul> : null
        );

        const allNodes: React.ReactNode[] = [];
        let tableBuffer: string[] = [];
        let listBuffer: React.ReactNode[] = [];
        let inAppendix = false;
        let inTOC = false;

        const flushBuffers = () => {
            if (listBuffer.length > 0) {
                allNodes.push(renderList(listBuffer, `list-${allNodes.length}`, inTOC));
                listBuffer = [];
            }
            if (tableBuffer.length > 0) {
                allNodes.push(renderTable(tableBuffer, `table-${allNodes.length}`, inAppendix));
                tableBuffer = [];
            }
        };

        // Counters for body rendering to match TOC numbering
        let bodyH2Count = 0;
        let bodyH3Count = 0;

        markdownContent.split('\n').forEach((line, index) => {
            const key = `node-${index}`;

            if (line.match(/^## Table of Contents/i)) {
                inTOC = true;
            } else if (inTOC && line.startsWith('## ')) {
                inTOC = false;
            }

            if (line.startsWith('## ')) {
                flushBuffers();
                if (line.toLowerCase().includes('table of contents')) return; // Skip raw TOC header, we build custom one

                bodyH2Count++;
                bodyH3Count = 0;
                
                const rawText = line.substring(3).trim();
                const cleanText = rawText.replace(/^\d+\.?\d*\.?\s*/, '').trim().replace(/\*\*/g, '');
                if (cleanText.toLowerCase().includes('appendix')) inAppendix = true;
                
                const sectionId = generateId(cleanText);
                const displayTitle = `${bodyH2Count}.0 ${cleanText}`;
                
                allNodes.push(<h2 key={key} id={sectionId} className="text-2xl font-bold mt-10 mb-4 pb-2 border-b-2">{displayTitle}</h2>);
            } else if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                if (listBuffer.length > 0) flushBuffers();
                tableBuffer.push(line);
            } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                if (tableBuffer.length > 0) flushBuffers();
                
                const listItemContent = line.trim().substring(2);
                listBuffer.push(<li key={key} className="ml-5 list-disc" dangerouslySetInnerHTML={{ __html: listItemContent.replace(/\*\*/g, '') }} />);
            } else if (line.trim() !== '') {
                flushBuffers();
                 if (line.startsWith('### ')) {
                    bodyH3Count++;
                    const rawText = line.substring(4).trim();
                    const cleanText = rawText.replace(/^\d+\.?\d*\.?\s*/, '').trim().replace(/\*\*/g, '');
                    const subId = generateId(cleanText);
                    const displayTitle = `${bodyH2Count}.${bodyH3Count} ${cleanText}`;
                    allNodes.push(<h3 key={key} id={subId} className="text-xl font-semibold mt-8 mb-3">{displayTitle}</h3>);
                 } else {
                    allNodes.push(<p key={key} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />);
                 }
            }
        });

        flushBuffers();

        const localPaginatedContent: React.ReactNode[] = [];
        let currentPageContent: React.ReactNode[] = [];

        // Generate Dynamic Table of Contents Page for Web View
        // We always include this if we found sections
        if (tocItems.length > 0) {
            const tocNode = (
                <div key="toc-page" className="report-page report-body-bg mb-8">
                    {/* Add ID here for the scrollspy top button target */}
                    <h2 id={generateId('Table of Contents')} className="text-2xl font-bold mb-6 pb-2 border-b-2 border-current">Table of Contents</h2>
                    <ul className="space-y-1">
                        {tocItems.map((item) => (
                            <li key={`toc-${item.id}`} className={item.level === 3 ? 'ml-6' : ''}>
                                 <a 
                                    href={`#${item.id}`} 
                                    className="group flex items-baseline cursor-pointer text-sm py-1"
                                    onClick={(e) => handleSmoothScroll(e, item.id)}
                                 >
                                    <span className="font-mono text-gray-500 mr-2 w-10 text-right flex-shrink-0">{item.displayTitle.split(' ')[0]}</span>
                                    <span className="group-hover:underline font-medium truncate">{item.text}</span>
                                    <span className="flex-grow border-b border-dotted border-current opacity-30 mx-2"></span>
                                    <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">Go</span>
                                 </a>
                            </li>
                        ))}
                    </ul>
                </div>
            );
            localPaginatedContent.push(tocNode);
        }

        allNodes.forEach((node) => {
            if (React.isValidElement(node) && node.type === 'h2') {
                if (currentPageContent.length > 0) {
                    localPaginatedContent.push(<div key={`page-${localPaginatedContent.length}`} className="report-page report-body-bg">{currentPageContent}</div>);
                    currentPageContent = [];
                }
            }
            currentPageContent.push(node);
        });

        if (currentPageContent.length > 0) {
            localPaginatedContent.push(<div key={`page-${localPaginatedContent.length}`} className="report-page report-body-bg">{currentPageContent}</div>);
        }

        return { paginatedContent: localPaginatedContent, mainSections: localMainSections };
    }, [markdownContent, reportId]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const intersectingEntry = entries.find(entry => entry.isIntersecting);
                if (intersectingEntry) {
                    setActiveSectionId(intersectingEntry.target.id);
                }
            },
            { rootMargin: '-35% 0px -65% 0px', threshold: 0 }
        );

        // Scope selection to the specific report container to avoid conflicts
        const sections = document.querySelectorAll(`#report-container-${reportId} h2[id]`);
        if (sections.length > 0) {
            sections.forEach((section) => observer.observe(section));
            if (!activeSectionId) {
                setActiveSectionId(sections[0].id);
            }
        }

        return () => {
            if (sections.length > 0) {
                sections.forEach((section) => observer.unobserve(section));
            }
        };
    }, [paginatedContent, activeSectionId, reportId]);

    return (
        <div id={`report-content-${reportId}`} className="max-w-none">
            <ScrollspyNav sections={mainSections} activeSectionId={activeSectionId} />
            {paginatedContent}
        </div>
    );
};

export default React.memo(ReportDisplay);
