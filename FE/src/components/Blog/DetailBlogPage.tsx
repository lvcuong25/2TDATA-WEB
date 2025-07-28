import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Spin, Typography, Breadcrumb, Tag, Divider, message, Space, Button } from 'antd';
import { CalendarOutlined, UserOutlined, TagOutlined, ShareAltOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import instance from '../../utils/axiosInstance';
import Header from '../Header';
import Footer from '../Footer';
import { toast } from 'react-toastify';

const { Title, Paragraph } = Typography;

const DetailBlogPage: React.FC = () => {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await instance.get(`/blogs/${id}`);
        setBlog(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching blog:", error);
        message.error("Failed to load blog. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  // useEffect(() => {
  //   if (blog) {
  //     //   }
  // }, [blog]);

  if (isLoading) return <Spin size="large" className="flex justify-center items-center h-screen" />;
  if (!blog) return <div className="text-center py-10">Blog not found</div>;

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const shareUrl = window.location.href;
  const shareTitle = blog.title;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Xem bài viết: ${shareTitle}`,
          url: shareUrl,
        });
      } catch (err) {
        // Người dùng hủy share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Đã sao chép link bài viết!');
      } catch {
        toast.error('Không thể sao chép link!');
      }
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-12">
      <Header/>
      <div className="container mx-auto  max-w-4xl pb-10">
        <Breadcrumb className="mb-6 mt-12 px-2 text-sm">
          <Breadcrumb.Item><Link to="/">Trang chủ</Link></Breadcrumb.Item>
          <Breadcrumb.Item><Link to="/blogs">Blogs</Link></Breadcrumb.Item>
          <Breadcrumb.Item>{blog.title}</Breadcrumb.Item>
        </Breadcrumb>

        <article className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {blog.image && (
            <div className="w-full h-[340px] relative overflow-hidden">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                style={{ borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
                onError={(e) => {
                  e.currentTarget.src = '/assets/images/fallback-image.jpg';
                }}
              />
            </div>
          )}

          <div className="p-8 pb-4">
            <Title level={1} className="mb-2 text-3xl font-bold text-gray-900">{blog.title}</Title>
            <Space className="text-gray-500 mb-4" size={16} wrap>
              <span><CalendarOutlined className="mr-1" />{formatDate(blog.createdAt)}</span>
              <span><UserOutlined className="mr-1" />{blog.author}</span>
              {blog.tags && blog.tags.length > 0 && (
                <span><TagOutlined className="mr-1" />{blog.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}</span>
              )}
            </Space>

            <Divider />

            <div className="content-area prose max-w-none text-gray-800 leading-7 px-8 pb-8">
              <ReactMarkdown 
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-4xl font-bold my-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-3xl font-bold my-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-2xl font-bold my-2" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-xl font-bold my-2" {...props} />,
                  h5: ({node, ...props}) => <h5 className="text-lg font-bold my-2" {...props} />,
                  p: ({node, ...props}) => <p className="my-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside my-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                  img: ({node, ...props}) => <img className="max-w-full h-auto my-2" {...props} />,
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-4">
                      <table className="table-auto border-collapse border border-gray-300 w-full" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => <thead className="bg-gray-100" {...props} />,
                  th: ({node, ...props}) => <th className="border border-gray-300 px-4 py-2 text-left" {...props} />,
                  td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                }}
              >
                {blog.content}
              </ReactMarkdown>
            </div>

            <Divider />

            <Space className="mt-6 px-8 pb-8" size={16} wrap>
              <Link
                to="/blogs"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-300"
              >
                Quay lại danh sách
              </Link>
              <Button
                type="primary"
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                style={{
                  background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(59,130,246,0.15)',
                  padding: '0 20px',
                  height: 40,
                  transition: 'background 0.3s',
                }}
                className="hover:scale-105 active:scale-95"
              >
                Chia sẻ bài viết
              </Button>
            </Space>
          </div>
        </article>
      </div>
        <Footer/>
    </div>
  );
};

export default DetailBlogPage;