
import React, { useMemo } from 'react';

interface ReportPageProps {
  content: string;
}

// Simple Markdown to HTML Element Parser
const parseMarkdown = (markdown: string) => {
  const elements = [];
  const lines = markdown.split('\n');
  let isTable = false;
  let tableData: { headers: string[]; rows: string[][] } = { headers: [], rows: [] };
  let keyCounter = 0;

  const renderTable = () => {
    if (tableData.headers.length === 0) return null;
    const tableElement = (
      <div key={`table-${keyCounter++}`} className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {tableData.headers.map((header, index) => (
                <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableData = { headers: [], rows: [] }; // Reset for next table
    return tableElement;
  };

  for (const line of lines) {
    if (line.trim().startsWith('|') && line.includes('|')) {
      if (!isTable) {
        isTable = true;
      }
      const columns = line.split('|').map(c => c.trim()).slice(1, -1);
      if (line.includes('---')) { // Header separator
        // do nothing, we just use the first row as header
      } else if (tableData.headers.length === 0) {
        tableData.headers = columns;
      } else {
        tableData.rows.push(columns);
      }
    } else {
      if (isTable) {
        elements.push(renderTable());
        isTable = false;
      }

      if (line.trim().startsWith('##')) {
        elements.push(<h2 key={keyCounter++} className="text-2xl font-bold mt-6 mb-3 text-gray-800">{line.substring(3).trim()}</h2>);
      } else if (line.trim().startsWith('#')) {
        elements.push(<h1 key={keyCounter++} className="text-3xl font-bold mt-4 mb-2 text-gray-900">{line.substring(2).trim()}</h1>);
      } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        elements.push(<li key={keyCounter++} className="ml-5 list-disc text-gray-700">{line.substring(2).trim()}</li>);
      } else if (line.trim()) {
        elements.push(<p key={keyCounter++} className="my-2 text-gray-700 leading-relaxed">{line.trim()}</p>);
      }
    }
  }

  if (isTable) {
    elements.push(renderTable());
  }

  return elements;
};

const ReportPage: React.FC<ReportPageProps> = ({ content }) => {
  const parsedContent = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className="prose max-w-none">
      {parsedContent}
    </div>
  );
};

export default ReportPage;
