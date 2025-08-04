import React from 'react';

// リンクを検出して自動的にクリック可能なリンクに変換する関数
export const detectAndConvertLinks = (text: string): React.ReactNode[] => {
  // URLの正規表現パターン
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  
  // テキストを分割してリンクとテキストを分離
  const parts = text.split(urlPattern);
  
  return parts.map((part, index) => {
    // URLかどうかを判定
    if (urlPattern.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#1976d2',
            textDecoration: 'underline',
            wordBreak: 'break-all'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    
    // 通常のテキスト
    return part;
  });
}; 