"use client";

import { useRouter } from "next/navigation";
import { Card, Button, Typography, Row, Col } from "antd";
import { EditOutlined, HomeOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

interface PageInfo {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const pages: PageInfo[] = [
  {
    key: "home",
    title: "Homepage",
    description: "Edit the main landing page content including hero, features, and security sections.",
    icon: <HomeOutlined style={{ fontSize: 24 }} />,
    path: "/admin/pages/home",
  },
];

export default function PagesManagementPage() {
  const router = useRouter();

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Manage Pages</h2>
        <Text type="secondary">
          Edit and customize the content of your website pages.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {pages.map((item) => (
          <Col key={item.key} xs={24} sm={24} md={12} lg={8} xl={8}>
            <Card
              hoverable
              onClick={() => router.push(item.path)}
              actions={[
                <Button
                  key="edit"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    router.push(item.path);
                  }}
                >
                  Edit Page
                </Button>,
              ]}
            >
              <Card.Meta
                avatar={
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500">
                    {item.icon}
                  </div>
                }
                title={item.title}
                description={
                  <Paragraph ellipsis={{ rows: 2 }} className="mb-0">
                    {item.description}
                  </Paragraph>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
