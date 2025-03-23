import './globals.css'

export const metadata = {
  title: '图像搜索应用',
  description: '基于百度AI的图像搜索应用',
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