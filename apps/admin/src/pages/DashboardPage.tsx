import { useCallback, useEffect, useState } from 'react'
import {
  Layout,
  Typography,
  Button,
  Table,
  Space,
  Modal,
  message,
  Avatar,
  Popconfirm,
  Upload,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import type { Philosopher, CreatePhilosopherInput } from '@philosophy/shared'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import PhilosopherForm from '../components/PhilosopherForm'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Philosopher | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.listPhilosophers()
      setPhilosophers(data)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleEdit = (record: Philosopher) => {
    setEditing(record)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deletePhilosopher(id)
      message.success('已删除')
      loadData()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleSubmit = async (values: CreatePhilosopherInput) => {
    try {
      if (editing) {
        await api.updatePhilosopher(editing.id, values)
        message.success('已更新')
      } else {
        await api.createPhilosopher(values)
        message.success('已创建')
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    }
  }

  const handleAvatarUpload = async (id: string, file: File) => {
    try {
      await api.uploadAvatar(id, file)
      message.success('头像已上传')
      loadData()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '上传失败')
    }
  }

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatarUrl',
      width: 80,
      render: (url: string | undefined, record: Philosopher) => (
        <Avatar src={url} size={48}>
          {record.name.charAt(0)}
        </Avatar>
      ),
    },
    { title: 'ID', dataIndex: 'id', width: 120 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '英文名', dataIndex: 'nameEn', ellipsis: true },
    { title: '时代', dataIndex: 'era', width: 120 },
    { title: '流派', dataIndex: 'school', width: 140 },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: Philosopher) => (
        <Space>
          <Upload
            showUploadList={false}
            accept="image/*"
            beforeUpload={(file) => {
              handleAvatarUpload(record.id, file)
              return false
            }}
          >
            <Button size="small" icon={<UploadOutlined />}>
              头像
            </Button>
          </Upload>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该哲学家？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          哲学学习 · 管理后台
        </Title>
        <Space>
          <Text type="secondary">{user?.username}</Text>
          <Button icon={<LogoutOutlined />} onClick={logout}>
            退出
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增哲学家
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={philosophers}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Content>

      <Modal
        title={editing ? '编辑哲学家' : '新增哲学家'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <PhilosopherForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </Layout>
  )
}
