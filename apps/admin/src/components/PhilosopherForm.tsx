import { useEffect } from 'react'
import { Form, Input, Button, Space } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import type { Philosopher, CreatePhilosopherInput } from '@philosophy/shared'

interface PhilosopherFormProps {
  initial?: Philosopher | null
  onSubmit: (values: CreatePhilosopherInput) => Promise<void>
  onCancel: () => void
}

interface FormValues {
  id: string
  name: string
  nameEn?: string
  era?: string
  school?: string
  summary?: string
  biography?: string
  works?: { title: string; year?: string; description?: string }[]
}

export default function PhilosopherForm({ initial, onSubmit, onCancel }: PhilosopherFormProps) {
  const [form] = Form.useForm<FormValues>()
  const isEdit = !!initial

  useEffect(() => {
    if (initial) {
      form.setFieldsValue({
        id: initial.id,
        name: initial.name,
        nameEn: initial.nameEn,
        era: initial.era,
        school: initial.school,
        summary: initial.summary,
        biography: initial.biography,
        works: initial.works?.map(({ title, year, description }) => ({
          title,
          year,
          description,
        })),
      })
    } else {
      form.resetFields()
    }
  }, [initial, form])

  const handleFinish = async (values: FormValues) => {
    const payload: CreatePhilosopherInput = {
      id: values.id,
      name: values.name,
      nameEn: values.nameEn,
      era: values.era,
      school: values.school,
      summary: values.summary,
      biography: values.biography,
      works: values.works?.filter((w) => w.title?.trim()),
    }
    await onSubmit(payload)
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item
        name="id"
        label="ID（英文标识，创建后不可改）"
        rules={[
          { required: true, message: '请输入 ID' },
          { pattern: /^[a-z0-9-]+$/, message: '仅小写字母、数字、连字符' },
        ]}
      >
        <Input disabled={isEdit} placeholder="nietzsche" />
      </Form.Item>

      <Form.Item name="name" label="中文名" rules={[{ required: true, message: '请输入姓名' }]}>
        <Input placeholder="尼采" />
      </Form.Item>

      <Form.Item name="nameEn" label="英文名">
        <Input placeholder="Friedrich Nietzsche" />
      </Form.Item>

      <Form.Item name="era" label="时代">
        <Input placeholder="1844–1900" />
      </Form.Item>

      <Form.Item name="school" label="流派">
        <Input placeholder="存在主义先驱" />
      </Form.Item>

      <Form.Item name="summary" label="简介">
        <Input.TextArea rows={2} placeholder="一句话简介" />
      </Form.Item>

      <Form.Item name="biography" label="生平">
        <Input.TextArea rows={4} placeholder="生平介绍" />
      </Form.Item>

      <Form.List name="works">
        {(fields, { add, remove }) => (
          <>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>代表作品</div>
            {fields.map(({ key, name, ...restField }) => (
              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                  {...restField}
                  name={[name, 'title']}
                  rules={[{ required: true, message: '书名' }]}
                >
                  <Input placeholder="著作名" style={{ width: 200 }} />
                </Form.Item>
                <Form.Item {...restField} name={[name, 'year']}>
                  <Input placeholder="年代" style={{ width: 100 }} />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} />
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                添加作品
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
        <Space>
          <Button type="primary" htmlType="submit">
            {isEdit ? '保存' : '创建'}
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
