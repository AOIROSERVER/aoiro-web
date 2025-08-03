import React from "react";

/**
 * focus: 'secret' | 'email' | 'password' | undefined
 * password時は手で目を隠す
 */
export default function BearAvatar({ focus }: { focus?: string }) {
  // 目の位置（合言葉・メール入力時は中央、パスワード時は隠す）
  const eyeY = 60;
  const eyeXLeft = focus === 'email' ? 65 : focus === 'secret' ? 55 : 60;
  const eyeXRight = focus === 'email' ? 95 : focus === 'secret' ? 85 : 90;
  const handY = focus === 'password' ? 40 : 100;
  const handOpacity = focus === 'password' ? 1 : 0;

  return (
    <svg width="160" height="120" viewBox="0 0 160 120" style={{ display: 'block', margin: '0 auto' }}>
      {/* 顔 */}
      <circle cx="80" cy="70" r="50" fill="#8d5524" />
      {/* 左耳 */}
      <circle cx="35" cy="35" r="20" fill="#8d5524" />
      {/* 右耳 */}
      <circle cx="125" cy="35" r="20" fill="#8d5524" />
      {/* 目 */}
      <ellipse cx={eyeXLeft} cy={eyeY} rx="6" ry="8" fill="#222" style={{ opacity: focus === 'password' ? 0 : 1, transition: 'all 0.3s' }} />
      <ellipse cx={eyeXRight} cy={eyeY} rx="6" ry="8" fill="#222" style={{ opacity: focus === 'password' ? 0 : 1, transition: 'all 0.3s' }} />
      {/* 鼻 */}
      <ellipse cx="80" cy="90" rx="10" ry="7" fill="#fff" />
      <ellipse cx="80" cy="92" rx="5" ry="4" fill="#222" />
      {/* 手（目隠し） */}
      <ellipse cx="60" cy={handY} rx="22" ry="12" fill="#a97c50" style={{ opacity: handOpacity, transition: 'all 0.3s' }} />
      <ellipse cx="100" cy={handY} rx="22" ry="12" fill="#a97c50" style={{ opacity: handOpacity, transition: 'all 0.3s' }} />
    </svg>
  );
} 