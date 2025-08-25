// 簡素化: Game Boy風テーマ固定のため、複雑なテーマ管理は不要
// CSSで十分

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}