import React from 'react'
import Header from "./Header";
import Footer from "./Footer";

const About = () => {
  return (
    <div>
      <Header />
      <div className="container mx-auto pt-[100px] py-12 text-center px-4">
      <h1 className="text-3xl font-bold mb-8">Về chúng tôi</h1>
      <p className="text-lg mb-6 max-w-3xl mx-auto">
        Công ty chúng tôi tự hào là đơn vị hàng đầu trong lĩnh vực cung cấp dịch vụ chuyên nghiệp tại Việt Nam. Với sứ mệnh mang đến giải pháp tối ưu và trải nghiệm hài lòng cho khách hàng, chúng tôi luôn không ngừng đổi mới, cải tiến và nâng cao chất lượng dịch vụ mỗi ngày.
      </p>
    
      <p className="text-lg mb-6 max-w-3xl mx-auto">
     Chúng tôi đã phục vụ hàng ngàn khách hàng cá nhân và doanh nghiệp trên toàn quốc. Chúng tôi cung cấp đa dạng các dịch vụ bao gồm:
      </p>
    
      <ul className="text-left list-none space-y-3 text-lg max-w-3xl mx-auto mb-6">
        <li className="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span>Dịch vụ tư vấn và giải pháp kinh doanh</span>
        </li>
        <li className="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Dịch vụ chăm sóc khách hàng chuyên nghiệp</span>
        </li>
        <li className="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.413 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Dịch vụ kỹ thuật và hỗ trợ công nghệ</span>
        </li>
        <li className="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6m0 6a3 3 0 110-6m0 6v6m-3 6H9m1.5-6H9m3-6H9m3-6H9" />
          </svg>
          <span>Các giải pháp marketing và truyền thông</span>
        </li>
        <li className="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Dịch vụ hậu mãi và chăm sóc sau bán hàng</span>
        </li>
      </ul>
    
      <p className="text-lg mb-6 max-w-3xl mx-auto">
        Đội ngũ của chúng tôi gồm những chuyên gia có kinh nghiệm, tâm huyết và tận tâm với khách hàng. Chúng tôi tin rằng chất lượng dịch vụ và sự tin tưởng của khách hàng là nền tảng vững chắc cho sự phát triển bền vững của công ty.
      </p>
    
      <p className="text-lg mb-6 max-w-3xl mx-auto">
        Hãy đồng hành cùng chúng tôi để trải nghiệm những dịch vụ tốt nhất và nhận được sự hỗ trợ tận tâm mọi lúc, mọi nơi.
      </p>
    
      <p className="text-lg font-semibold max-w-3xl mx-auto">
        Cảm ơn bạn đã tin tưởng và lựa chọn chúng tôi!
      </p>
    </div>
    
      <Footer />
    </div>
  )
}

export default About
