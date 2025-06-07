import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Spin, Row, Col, Typography, Pagination, Card, Tag, Space, message, Input, List } from 'antd';
import { CalendarOutlined, UserOutlined, EyeOutlined, SearchOutlined, FireOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import instance from "../../utils/axiosInstance";
import Header from "../Header";
import Footer from "../Footer";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface Blog {
  _id: string;
  title: string;
  content: string;
  image: string;
  createdAt: string;
  author: string;
  tags: string[];
}

const AllBlogPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalBlogs, setTotalBlogs] = useState<number>(0);
  const pageSize = 9;

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      try {
        const response = await instance.get(`/blogs?page=${currentPage}&limit=${pageSize}`);
        
        if (Array.isArray(response.data)) {
          setBlogs(response.data);
          setTotalBlogs(response.data.length);
        } else {
          console.error("Unexpected API response structure:", response.data);
          setBlogs([]);
          setTotalBlogs(0);
          message.error("Failed to load blogs. Unexpected data structure.");
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setBlogs([]);
        setTotalBlogs(0);
        message.error("Failed to load blogs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const truncateHTML = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    const truncated = content.substr(0, content.lastIndexOf(' ', maxLength));
    return truncated + '...';
  };

  if (isLoading) return <Spin size="large" className="flex justify-center items-center h-screen" />;

  return (
    <div className="bg-gray-50 min-h-screen pt-12">

      <Header/>
      <div className="container mx-auto px-4 pb-10">
        <Title level={2} className="text-center mb-8 text-gray-800">Danh sách bài viết</Title>
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={6}>
            <Card className="shadow-sm sticky top-4">
              <div className="space-y-6">
                <Search
                  placeholder="Search blogs..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  className="mb-4"
                />
                
                <div>
                  <Title level={4} className="text-gray-700 mb-4">Bài viết mới nhất</Title>
                  <List
                    dataSource={blogs.slice(0, 3)}
                    renderItem={blog => (
                      <List.Item>
                        <Link to={`/blogs/${blog._id}`} className="text-gray-600 hover:text-blue-600">
                          {blog.title}
                        </Link>
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={18}>
            <Card className="shadow-sm mb-6 bg-white">
              <div className="flex justify-between items-center">
                <Text className="text-gray-600">
                  Showing {blogs.length} of {totalBlogs} results
                </Text>
                <Space>
                  <Tag icon={<FireOutlined />} color="red">Hot</Tag>
                  <Tag color="blue">New</Tag>
                </Space>
              </div>
            </Card>
            <Row gutter={[24, 24]}>
              {blogs.map((blog: Blog) => (
                <Col xs={24} sm={12} xl={8} key={blog._id}>
                  <Card
                    hoverable
                    cover={
                      <div className="relative">
                        <img
                          alt={blog.title}
                          src={blog.image}
                          className="h-48 w-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Tag color="blue">New</Tag>
                        </div>
                      </div>
                    }
                    className="shadow-sm h-full flex flex-col transition-all duration-300 hover:shadow-md"
                  >
                    <Card.Meta
                      title={
                        <Link to={`/blogs/${blog._id}`} className="text-lg font-semibold hover:text-blue-600 line-clamp-2">
                          {blog.title}
                        </Link>
                      }
                      description={
                        <>
                          <div className="text-gray-600 prose prose-sm max-w-none line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: truncateHTML(blog.content, 150) }}
                          >
                          </div>
                          <Space className="mt-3" size={[0, 8]} wrap>
                            {blog.tags && blog.tags.map(tag => (
                              <Tag key={tag} color="blue" className="hover:opacity-80">{tag}</Tag>
                            ))}
                          </Space>
                          <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                            <span><CalendarOutlined className="mr-1" /> {formatDate(blog.createdAt)}</span>
                            <span><UserOutlined className="mr-1" /> {blog.author}</span>
                          </div>
                        </>
                      }
                    />
                    <Link 
                      to={`/blogs/${blog._id}`} 
                      className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 transition-colors duration-300"
                    >
                      Read More
                      <EyeOutlined className="ml-2" />
                    </Link>
                  </Card>
                </Col>
              ))}
            </Row>
            {totalBlogs > pageSize && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  current={currentPage}
                  total={totalBlogs}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  className="bg-white p-4 rounded-lg shadow-sm"
                />
              </div>
            )}
          </Col>
        </Row>
      </div>
      <Footer/>
    </div>
  );
};

export default AllBlogPage;