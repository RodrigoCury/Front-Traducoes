import {
  Alert,
  Breadcrumb,
  Button,
  Form,
  Input,
  Layout,
  notification,
  Popconfirm,
  Row,
  Space,
  Table,
  Typography,
} from 'antd'
import { Content, Footer, Header } from 'antd/lib/layout/layout'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import 'antd/dist/antd.min.css'
import FormItem from 'antd/es/form/FormItem'
import axios from 'axios'
import { CheckCircleTwoTone, CloseCircleTwoTone, EditTwoTone, SearchOutlined } from '@ant-design/icons'
import Highlighter from 'react-highlight-words'
import TextArea from 'antd/lib/input/TextArea'

const EditableCell = ({ editing, dataIndex, title, inputType, record, index, children, ...restProps }) => {
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {dataIndex === 'key' ? <Input /> : <TextArea />}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  )
}

const openNotificationWithIcon = (type, message) => {
  notification[type]({ message })
}

const App = () => {
  const [path, setPath] = useState({ path: null })
  const [errorMessage, setErrorMessage] = useState(null)
  const [editingKey, setEditingKey] = useState('')
  const [translations, setTranslations] = useState([])
  const [form] = Form.useForm()

  const isEditing = (record) => record?.key === editingKey

  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef(null)

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  const handleReset = (clearFilters) => {
    clearFilters()
    setSearchText('')
  }

  const edit = (record) => {
    form.setFieldsValue({
      key: '',
      pt: '',
      es: '',
      en: '',
      ...record,
    })
    setEditingKey(record.key)
  }

  const getTranlations = useCallback(async () => {
    try {
      const { data: translationsList } = await axios.get('http://localhost:4200/file')
      setTranslations(translationsList)
    } catch (error) {
      setErrorMessage(error.request?.body?.message || 'Cury é burro e n codou direito')
    }
  }, [])

  const savePath = useCallback(
    async (data) => {
      try {
        const { data: pathValidated } = await axios.post('http://localhost:4200/path', data)
        setPath({ path: pathValidated })
        setErrorMessage(null)
        getTranlations()
      } catch (error) {
        setErrorMessage('Caminho Invalido')
        setPath({ path: null })
      }
    },
    [getTranlations]
  )

  const checkIfPathIsSet = useCallback(async () => {
    try {
      const { data: pathValidated } = await axios.get('http://localhost:4200/path')
      setPath({ path: pathValidated })
      getTranlations()
    } catch (error) {
      setPath({ path: null })
    }
  }, [getTranlations])

  const saveRow = useCallback(
    async (originalKey) => {
      setEditingKey('')
      try {
        const updatedData = await form.validateFields()
        await axios.put('http://localhost:4200/key', { originalKey, ...updatedData })
        getTranlations()
      } catch (error) {
        console.log(error)
        openNotificationWithIcon('error', error.response?.data)
      }
    },
    [form, getTranlations]
  )

  useLayoutEffect(() => {
    checkIfPathIsSet()
  }, [checkIfPathIsSet])

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div
        style={{
          padding: 8,
        }}
      >
        <Input
          ref={searchInput}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type='primary'
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size='small'
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size='small'
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? '#1890ff' : undefined,
        }}
      />
    ),
    onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100)
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: '#ffc069',
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  })

  const collumns = [
    {
      title: 'Chave',
      dataIndex: 'key',
      editable: true,
      sorter: (a, b) => (a?.name < b?.name ? 1 : -1),
      ...getColumnSearchProps('key'),
    },
    {
      title: 'Português',
      dataIndex: 'pt',
      editable: true,
    },
    {
      title: 'Espanhol',
      dataIndex: 'es',
      editable: true,
    },
    {
      title: 'Inglês',
      dataIndex: 'en',
      editable: true,
    },
    {
      title: '',
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <Space>
            <Popconfirm title='Certeza que quer salvar?' onConfirm={() => saveRow(record.key)}>
              <Button icon={<CheckCircleTwoTone />} title='salvar' />
            </Popconfirm>
            <Button icon={<CloseCircleTwoTone />} onClick={() => setEditingKey('')} />
          </Space>
        ) : (
          <Button disabled={editingKey !== ''} onClick={() => edit(record)} icon={<EditTwoTone />} />
        )
      },
    },
  ].map((col) => {
    if (!col.editable) {
      return col
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    }
  })

  return (
    <Layout className='layout'>
      <Header
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#157AC2',
          borderBottomRightRadius: '25px',
          borderBottomLeftRadius: '25px',
        }}
      >
        <Row justify='center' align='middle'>
          <Typography.Title style={{ color: 'white', marginBottom: 0 }}>Tradutor Astral</Typography.Title>
        </Row>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Paloma Poeta</Breadcrumb.Item>
          <Breadcrumb.Item>Montanhas</Breadcrumb.Item>
          <Breadcrumb.Item>Protótipo</Breadcrumb.Item>
        </Breadcrumb>
        <div className='site-layout-content' style={{ width: '100%' }}>
          <Row justify='center' align='middle' style={{ marginBottom: 24 }}>
            <Form
              labelWrap
              labelAlign='left'
              name='basic'
              layout='inline'
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              initialValues={{ path: '' }}
              onFinish={savePath}
              autoComplete='off'
            >
              <FormItem
                label={
                  <Typography.Text style={{ marginRight: '4px' }}>Caminho para a pasta de traduções</Typography.Text>
                }
                name='path'
                rules={[{ required: true, message: 'O caminho para a pasta é necessário' }]}
              >
                <Input placeholder={path.path ?? '/caminho/completo/para/locales'} />
              </FormItem>
              <Form.Item>
                <Button type='primary' htmlType='submit' shape='round'>
                  Atualizar Caminho
                </Button>
              </Form.Item>
            </Form>
          </Row>
          <PathAlert errorMessage={errorMessage} />
          {!path.path ? (
            <Alert message='Você precisa definir um caminho para a pasta de traduções' type='warning' showIcon />
          ) : (
            <Form form={form} component={false}>
              <Table
                rowKey='key'
                columns={collumns}
                dataSource={translations}
                components={{
                  body: {
                    cell: EditableCell,
                  },
                }}
              />
            </Form>
          )}
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Tradutor Astral ©2022 Created by Curyrim</Footer>
    </Layout>
  )
}

const PathAlert = ({ errorMessage }) => errorMessage && <Alert message={errorMessage} type='error' showIcon />

export default App
