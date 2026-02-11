"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Spin,
  Empty,
  Tooltip,
  Collapse,
  Typography,
  Drawer,
  App,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { apiClient } from "@/lib/api/client";
import { defaultSections as sharedDefaultSections, Section } from "@/lib/hooks/useCMSContent";

const { TextArea } = Input;
const { Text, Title } = Typography;

const CMS_STORAGE_KEY = "cms_homepage_content";

const sectionTypes = [
  { value: "hero", label: "Hero Section" },
  { value: "features", label: "Features Section" },
  { value: "security", label: "Security Section" },
  { value: "cta", label: "Call to Action" },
  { value: "custom", label: "Custom Section" },
];

// Use shared defaults from the hook
const defaultSections = sharedDefaultSections;

// Preview component for live preview
function PreviewSection({ section }: { section: Section }) {
  const renderHero = () => (
    <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-orange-900 text-white p-8 rounded-lg">
      <h1 className="text-3xl font-bold mb-4">
        {section.content.headline}{" "}
        <span className="text-orange-500">{section.content.highlightedText}</span>
      </h1>
      <p className="text-gray-300 mb-6">{section.content.subheadline}</p>
      <button className="bg-orange-500 text-white px-6 py-2 rounded-lg">
        {section.content.ctaText}
      </button>
    </div>
  );

  const renderFeatures = () => (
    <div className="bg-white p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-2">{section.content.sectionTitle}</h2>
      <p className="text-gray-600 text-center mb-6">{section.content.sectionSubtitle}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {section.content.features?.map((feature: any, idx: number) => (
          <div key={idx} className="border rounded-lg p-4 shadow-sm">
            <div className="w-10 h-10 bg-orange-100 rounded-lg mb-3 flex items-center justify-center">
              <span className="text-orange-500">✓</span>
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
            <ul className="text-xs text-gray-500">
              {feature.bullets?.map((b: string, i: number) => (
                <li key={i}>• {b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="bg-gray-50 p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6">{section.content.sectionTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 text-white p-6 rounded-lg flex items-center justify-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
            <span className="text-orange-500 text-2xl">⚡</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-3">Lightning Fast</h3>
          <ul className="space-y-2">
            {section.content.features?.map((f: any, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-orange-500">✓</span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-800 text-white p-6 rounded-lg">
          <h3 className="font-bold mb-3">The Roadmap Ahead</h3>
          <ul className="space-y-2">
            {section.content.roadmap?.map((r: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderCustom = () => (
    <div className="bg-gray-100 p-8 rounded-lg">
      <h3 className="font-semibold mb-2">{section.title}</h3>
      <pre className="text-xs bg-white p-4 rounded overflow-auto">
        {JSON.stringify(section.content, null, 2)}
      </pre>
    </div>
  );

  switch (section.type) {
    case "hero":
      return renderHero();
    case "features":
      return renderFeatures();
    case "security":
      return renderSecurity();
    default:
      return renderCustom();
  }
}

export default function HomePageEditor() {
  const { message, modal } = App.useApp();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  const fetchContent = useCallback(async () => {
    setLoading(true);

    // First, check localStorage (this is what the homepage actually uses)
    try {
      const stored = localStorage.getItem(CMS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSections(parsed);
          setLoading(false);
          return; // Use localStorage content since that's what the homepage displays
        }
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e);
    }

    // Fall back to API if localStorage is empty
    try {
      const result = await apiClient.getPageContent("home");
      if (result.error || !result.data) {
        // Use default sections if API fails
        setSections(defaultSections);
      } else {
        const content = result.data as any;
        if (content.sections && content.sections.length > 0) {
          setSections(content.sections);
        } else {
          setSections(defaultSections);
        }
      }
    } catch {
      setSections(defaultSections);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage first (this is what the homepage reads)
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(sections));

      // Also try to save to backend
      const result = await apiClient.updatePageContent("home", sections);

      if (result.error) {
        message.success("Changes saved! Open the homepage to see your updates.");
      } else {
        message.success("Changes saved successfully! The homepage will reflect these changes.");
      }

      setHasChanges(false);

      // Trigger a custom event so the homepage can listen for updates (same-tab updates)
      window.dispatchEvent(new CustomEvent("cms-content-updated", { detail: { page: "home", sections } }));
    } catch {
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(sections));
      message.success("Changes saved! Open the homepage to see your updates.");
      setHasChanges(false);
    }
    setSaving(false);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    newSections.forEach((s, i) => (s.order = i));
    setSections(newSections);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    newSections.forEach((s, i) => (s.order = i));
    setSections(newSections);
    setHasChanges(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    modal.confirm({
      title: "Delete Section",
      content: "Are you sure you want to delete this section?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        const newSections = sections.filter((s) => s.id !== sectionId);
        newSections.forEach((s, i) => (s.order = i));
        setSections(newSections);
        setHasChanges(true);
        message.success("Section deleted");
      },
    });
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    form.setFieldsValue({
      title: section.title,
      content: JSON.stringify(section.content, null, 2),
    });
    setIsModalOpen(true);
  };

  const handleEditModalOk = async () => {
    try {
      const values = await form.validateFields();
      let parsedContent;
      try {
        parsedContent = JSON.parse(values.content);
      } catch {
        message.error("Invalid JSON content");
        return;
      }

      const newSections = sections.map((s) =>
        s.id === editingSection?.id
          ? { ...s, title: values.title, content: parsedContent }
          : s
      );
      setSections(newSections);
      setHasChanges(true);
      setIsModalOpen(false);
      form.resetFields();
      setEditingSection(null);
      message.success("Section updated - click Save Changes to apply");
    } catch {
      // Validation failed
    }
  };

  const getDefaultContent = (type: string): Record<string, any> => {
    switch (type) {
      case "hero":
        return {
          headline: "Your Headline Here",
          highlightedText: "Highlighted Text",
          subheadline: "Your subheadline text goes here",
          ctaText: "Get Started",
          ctaLink: "/signup",
        };
      case "features":
        return {
          sectionTitle: "Features Title",
          sectionSubtitle: "Features subtitle",
          features: [
            { icon: "Check", title: "Feature 1", description: "Description", bullets: ["Bullet 1"] },
          ],
        };
      case "security":
        return {
          sectionTitle: "Security Title",
          features: [{ icon: "Lock", label: "Secure" }],
          roadmap: ["Roadmap item 1"],
        };
      default:
        return { title: "Custom Section", content: "Your content here" };
    }
  };

  const handleAddSection = async () => {
    try {
      const values = await addForm.validateFields();
      let parsedContent = getDefaultContent(values.type);

      if (values.content) {
        try {
          parsedContent = JSON.parse(values.content);
        } catch {
          message.error("Invalid JSON content");
          return;
        }
      }

      const newSection: Section = {
        id: `section_${Date.now()}`,
        type: values.type,
        title: values.title || sectionTypes.find(t => t.value === values.type)?.label || "New Section",
        content: parsedContent,
        order: sections.length,
      };

      setSections([...sections, newSection]);
      setHasChanges(true);
      setIsAddModalOpen(false);
      addForm.resetFields();
      message.success("Section added - click Save Changes to apply");
    } catch {
      // Validation failed
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/pages">
            <Button icon={<ArrowLeftOutlined />}>Back</Button>
          </Link>
          <div>
            <Title level={4} className="mb-0">
              Edit Homepage
            </Title>
            <Text type="secondary">Manage sections and content</Text>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchContent}>
            Reset
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={() => setIsPreviewOpen(true)}
            type="default"
          >
            Preview Changes
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Space>
      </div>

      {hasChanges && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <Text type="warning">You have unsaved changes. Click "Save Changes" to apply them to the homepage.</Text>
        </div>
      )}

      <Card
        title="Page Sections"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
            Add Section
          </Button>
        }
      >
        {sections.length === 0 ? (
          <Empty description="No sections yet">
            <Button type="primary" onClick={() => setIsAddModalOpen(true)}>
              Add First Section
            </Button>
          </Empty>
        ) : (
          <div className="space-y-3">
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <Card
                  key={section.id}
                  size="small"
                  className="border-l-4 border-l-orange-500"
                  styles={{ body: { padding: "12px 16px" } }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <Tooltip title="Move up">
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={index === 0}
                            onClick={() => handleMoveUp(index)}
                          />
                        </Tooltip>
                        <Tooltip title="Move down">
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowDownOutlined />}
                            disabled={index === sections.length - 1}
                            onClick={() => handleMoveDown(index)}
                          />
                        </Tooltip>
                      </div>
                      <div>
                        <Text strong>{section.title}</Text>
                        <br />
                        <Text type="secondary" className="text-xs">
                          Type: {section.type} | Order: {section.order + 1}
                        </Text>
                      </div>
                    </div>
                    <Space>
                      <Tooltip title="Edit">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditSection(section)}
                        />
                      </Tooltip>
                      <Tooltip title="Delete">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteSection(section.id)}
                        />
                      </Tooltip>
                    </Space>
                  </div>
                  <Collapse
                    ghost
                    size="small"
                    className="mt-2"
                    items={[
                      {
                        key: "preview",
                        label: <Text type="secondary" className="text-xs">Preview Section</Text>,
                        children: <PreviewSection section={section} />,
                      },
                      {
                        key: "content",
                        label: <Text type="secondary" className="text-xs">View JSON</Text>,
                        children: (
                          <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(section.content, null, 2)}
                          </pre>
                        ),
                      },
                    ]}
                  />
                </Card>
              ))}
          </div>
        )}
      </Card>

      {/* Full Page Preview Drawer */}
      <Drawer
        title="Homepage Preview"
        placement="right"
        width="80%"
        onClose={() => setIsPreviewOpen(false)}
        open={isPreviewOpen}
        extra={
          <Space>
            <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
            <Button type="primary" onClick={() => { handleSave(); setIsPreviewOpen(false); }} disabled={!hasChanges}>
              Save & Close
            </Button>
          </Space>
        }
      >
        <div className="space-y-4">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div key={section.id}>
                <Text type="secondary" className="text-xs mb-1 block">
                  {section.title} ({section.type})
                </Text>
                <PreviewSection section={section} />
              </div>
            ))}
        </div>
      </Drawer>

      {/* Edit Section Modal */}
      <Modal
        title={`Edit: ${editingSection?.title}`}
        open={isModalOpen}
        onOk={handleEditModalOk}
        forceRender
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingSection(null);
        }}
        okText="Update"
        width={800}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label="Section Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content (JSON)"
            rules={[{ required: true, message: "Please enter content" }]}
            extra="Edit the JSON to customize this section's content"
          >
            <TextArea rows={15} style={{ fontFamily: "monospace", fontSize: 12 }} />
          </Form.Item>
        </Form>
        {editingSection && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <Text type="secondary" className="text-xs mb-2 block">Live Preview:</Text>
            <PreviewSection
              section={{
                ...editingSection,
                content: (() => {
                  try {
                    return JSON.parse(form.getFieldValue("content") || "{}");
                  } catch {
                    return editingSection.content;
                  }
                })(),
              }}
            />
          </div>
        )}
      </Modal>

      {/* Add Section Modal */}
      <Modal
        title="Add New Section"
        open={isAddModalOpen}
        onOk={handleAddSection}
        forceRender
        onCancel={() => {
          setIsAddModalOpen(false);
          addForm.resetFields();
        }}
        okText="Add Section"
        width={700}
      >
        <Form form={addForm} layout="vertical" className="mt-4">
          <Form.Item
            name="type"
            label="Section Type"
            rules={[{ required: true, message: "Please select a type" }]}
          >
            <select
              className="w-full h-10 px-3 border border-gray-300 rounded-md"
              onChange={(e) => {
                const type = e.target.value;
                addForm.setFieldsValue({
                  title: sectionTypes.find((t) => t.value === type)?.label || type,
                  content: JSON.stringify(getDefaultContent(type), null, 2),
                });
              }}
            >
              <option value="">Select a type...</option>
              {sectionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Form.Item>
          <Form.Item
            name="title"
            label="Section Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content (JSON)"
            extra="Customize the default content or leave as is"
          >
            <TextArea rows={10} style={{ fontFamily: "monospace", fontSize: 12 }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
