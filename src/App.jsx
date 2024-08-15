import { useState } from 'react'
import { Layout } from 'antd'
import Logo from './components/core/logo';

const {Header, Sider}= Layout
function App() {
  return (
    <Layout>
      <Sider className='sidebar'>Sidebar</Sider>
      <Logo/>
    </Layout>
    
  )
}


export default App
