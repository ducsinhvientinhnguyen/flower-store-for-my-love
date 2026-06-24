import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { api } from '../lib/api'
import FadeInView from '../components/motion/FadeInView'
import ParallaxLayer from '../components/motion/ParallaxLayer'

function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const res = await api.get('/products/featured')
      if (!res.ok) throw new Error('Failed to load featured products')
      return res.json()
    },
  })
}

export default function LandingPage() {
  const { data: products = [] } = useFeaturedProducts()

  return (
    <div className="bg-cream text-charcoal">
      <header className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-charcoal/10">
        <span className="font-serif text-lg">🌸 Flower Store</span>
        <Link
          to="/login"
          className="text-xs uppercase tracking-widest border border-gold text-gold px-4 py-2 hover:bg-gold hover:text-cream transition-colors"
        >
          Đăng nhập
        </Link>
      </header>

      <ParallaxLayer className="py-24 md:py-32 text-center px-6">
        <h1 className="font-serif text-4xl md:text-6xl">Hoa Tươi Mỗi Ngày</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-gold mt-4">
          Tinh tế · Thủ công · Bền vững
        </p>
        <a
          href="#featured"
          className="inline-block mt-8 border border-gold text-gold text-xs uppercase tracking-widest px-6 py-3 hover:bg-gold hover:text-cream transition-colors"
        >
          Khám phá sản phẩm
        </a>
      </ParallaxLayer>

      <FadeInView className="py-20 px-6 text-center max-w-xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-gold">Câu chuyện</p>
        <h2 className="font-serif text-2xl md:text-3xl mt-3">Từ tâm huyết đến từng cánh hoa</h2>
        <p className="text-charcoal-soft text-sm mt-4">
          Mỗi bó hoa được chọn lựa và cắm tay cẩn thận, mang đến sự tươi mới và tinh tế cho từng
          khoảnh khắc của bạn.
        </p>
      </FadeInView>

      <section id="featured" className="py-20 px-6">
        <p className="text-center text-xs uppercase tracking-widest text-gold mb-10">
          Sản phẩm nổi bật
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {products.map(product => (
            <FadeInView key={product.id}>
              <motion.div
                className="bg-white rounded-lg overflow-hidden border border-charcoal/10"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover" />
                <div className="p-3">
                  <p className="font-serif text-sm">{product.name}</p>
                  <p className="text-gold text-xs mt-1">{product.basePrice.toLocaleString('vi-VN')}đ</p>
                </div>
              </motion.div>
            </FadeInView>
          ))}
        </div>
      </section>

      <footer className="px-6 md:px-12 py-10 border-t border-charcoal/10 flex flex-col md:flex-row justify-between gap-2 text-sm text-charcoal-soft">
        <div>
          🌸 Flower Store
          <br />
          123 Đường Hoa, Q1, TP.HCM
        </div>
        <div>
          Hotline: 090x xxx xxx
          <br />
          9:00 - 21:00 hằng ngày
        </div>
      </footer>
    </div>
  )
}
