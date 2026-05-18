import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { ApiBootstrap } from '@/app/providers/ApiBootstrap'
import { AppRoutes } from '@/app/router'

export default function App() {
  return (
    <AppProviders>
      <ApiBootstrap>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ApiBootstrap>
    </AppProviders>
  )
}
