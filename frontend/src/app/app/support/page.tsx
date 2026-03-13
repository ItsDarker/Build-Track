'use client';

import React from 'react';
import { Card, Tabs, Empty, Button } from 'antd';
import { QuestionCircleOutlined, BookOutlined, PhoneOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function SupportPage() {
  const tabItems = [
    {
      key: 'chat',
      label: (
        <>
          <QuestionCircleOutlined />
          AI Chat Support
        </>
      ),
      children: (
        <Card>
          <div className="text-center py-12">
            <QuestionCircleOutlined style={{ fontSize: 48, color: '#ea8028', marginBottom: 16 }} />
            <h3 className="text-lg font-semibold mb-4">AI Chat Support</h3>
            <p className="text-gray-600 mb-6">
              HelpNest AI chat interface is being set up. In the meantime, you can use the chat widget in the top-right corner or browse our knowledge base below.
            </p>
            <p className="text-sm text-gray-500">
              Phase 1 of HelpNest integration is in progress. Full chat integration coming soon!
            </p>
          </div>
        </Card>
      ),
    },
    {
      key: 'kb',
      label: (
        <>
          <BookOutlined />
          Knowledge Base
        </>
      ),
      children: (
        <Card>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Knowledge Base</h3>
              <p className="text-gray-600 mb-6">
                BuildTrack Knowledge Base is being populated with comprehensive guides for all 16 workflow modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Getting Started */}
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">Getting Started</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Learn the basics of BuildTrack, create projects, and invite team members.
                </p>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>• Creating Your First Project</li>
                  <li>• Inviting Team Members</li>
                  <li>• Understanding Roles & Permissions</li>
                  <li>• Setting Up Your Dashboard</li>
                </ul>
              </div>

              {/* Modules Guide */}
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">Modules Guide</h4>
                <p className="text-sm text-gray-600 mb-3">
                  In-depth guides for all 16 BuildTrack modules.
                </p>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>• CRM Leads (crm-leads)</li>
                  <li>• Projects (projects)</li>
                  <li>• Work Orders (support-warranty)</li>
                  <li>• Manufacturing & QC</li>
                </ul>
              </div>

              {/* Workflows */}
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">Workflows</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Learn how to manage complete construction workflows.
                </p>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>• Lead to Project Workflow</li>
                  <li>• Project to Delivery Workflow</li>
                  <li>• Quality Control Process</li>
                </ul>
              </div>

              {/* Troubleshooting */}
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-semibold mb-2">Troubleshooting</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Common issues and how to resolve them.
                </p>
                <ul className="text-xs space-y-1 text-gray-500">
                  <li>• Records Not Appearing</li>
                  <li>• Permission Denied Error</li>
                  <li>• Database Sync Issues</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> The AI chat widget in the top-right corner can answer questions about these topics. Use it for quick answers!
              </p>
            </div>
          </div>
        </Card>
      ),
    },
    {
      key: 'contact',
      label: (
        <>
          <PhoneOutlined />
          Contact Support
        </>
      ),
      children: (
        <Card>
          <div className="max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Contact Our Support Team</h3>
            <p className="text-gray-600 mb-6">
              For urgent issues or complex problems, reach out directly to our support team.
            </p>

            <div className="space-y-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">📧 Email Support</h4>
                <p className="text-gray-600 mb-2">support@buildtrack.com</p>
                <p className="text-sm text-gray-500">Response time: Within 2 hours during business hours</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">📞 Phone Support</h4>
                <p className="text-gray-600 mb-2">(555) 123-4567</p>
                <p className="text-sm text-gray-500">Monday - Friday, 9:00 AM - 5:00 PM EST</p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">💬 Live Chat</h4>
                <p className="text-gray-600 mb-2">
                  Use the AI chat widget in the top-right corner for instant support
                </p>
                <p className="text-sm text-gray-500">Available 24/7 with AI assistance</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Security Issues:</strong> If you discovered a security vulnerability, please email security@buildtrack.com immediately with details.
              </p>
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">BuildTrack Support Center</h1>
          <p className="text-gray-600">
            Get help with BuildTrack features, troubleshooting, and best practices
          </p>
        </div>

        <Tabs items={tabItems} defaultActiveKey="chat" />

        {/* Quick Links */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/app/profile">
              <Button block size="large" className="text-left">
                📋 View Your Profile
              </Button>
            </Link>
            <Link href="/app/dashboard">
              <Button block size="large" className="text-left">
                📊 Back to Dashboard
              </Button>
            </Link>
            <Link href="/app/team">
              <Button block size="large" className="text-left">
                👥 Team Members
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
