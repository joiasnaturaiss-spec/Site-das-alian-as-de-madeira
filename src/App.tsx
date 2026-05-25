import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Creator } from './pages/Creator';
import { Catalog } from './pages/Catalog';
import { Product } from './pages/Product';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ClientProfileSettings } from './pages/ClientProfileSettings';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

import { AdminSettings } from './pages/AdminSettings';
import { ConfigProvider } from './context/ConfigContext';
import { CartProvider } from './context/CartContext';
import { EditorProvider } from './context/EditorContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ScrollToTop } from './components/ScrollToTop';

export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <CartProvider>
          <ChatProvider>
            <EditorProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                {/* Main App Layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="catalogo" element={<Catalog />} />
                  <Route path="produto/:id" element={<Product />} />
                  <Route path="criar" element={<Creator />} />
                  <Route path="sobre" element={<About />} />
                  <Route path="contato" element={<Contact />} />
                  <Route path="carrinho" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  <Route path="perfil" element={<ClientProfileSettings />} />
                </Route>

                {/* User Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Register />} />

                {/* Admin Routes (No Bottom Nav/Top Bar) */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/config" element={<AdminSettings />} />
              </Routes>
            </BrowserRouter>
          </EditorProvider>
        </ChatProvider>
      </CartProvider>
    </AuthProvider>
  </ConfigProvider>
  );
}
