import './globals.css'

export const metadata = {
  title: 'YnnAI Product Library',
  description: '基于百度AI的产品图片库',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  )
} 