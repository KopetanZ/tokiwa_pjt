// 簡素化: 通知機能は各コンポーネント内でシンプルに実装
// グローバル状態管理は不要

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// 互換性のためのダミー関数
export function useToast() {
  return {
    addToast: () => {},
    removeToast: () => {},
    toasts: []
  }
}