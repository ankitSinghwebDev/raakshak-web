import { Skeleton, Card, Row, Col } from 'antd'

/** Dashboard-style skeleton with KPI cards + charts */
export const DashboardSkeleton = () => (
  <div className="adm-skeleton-fade">
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      {[...Array(6)].map((_, i) => (
        <Col xs={12} sm={8} lg={4} key={i}>
          <Card size="small" className="adm-kpi-card"><Skeleton active paragraph={false} title={{ width: '60%' }} /></Card>
        </Col>
      ))}
    </Row>
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} lg={12}><Card size="small" className="adm-chart-card"><Skeleton active paragraph={{ rows: 5 }} /></Card></Col>
      <Col xs={24} lg={12}><Card size="small" className="adm-chart-card"><Skeleton active paragraph={{ rows: 5 }} /></Card></Col>
    </Row>
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}><Card size="small" className="adm-chart-card"><Skeleton active paragraph={{ rows: 4 }} /></Card></Col>
      <Col xs={24} md={8}><Card size="small" className="adm-chart-card"><Skeleton active paragraph={{ rows: 4 }} /></Card></Col>
      <Col xs={24} md={8}><Card size="small" className="adm-chart-card"><Skeleton active paragraph={{ rows: 4 }} /></Card></Col>
    </Row>
  </div>
)

/** List-style skeleton with toolbar + cards */
export const ListSkeleton = () => (
  <div className="adm-skeleton-fade">
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <Skeleton.Input active style={{ width: 260, height: 40 }} />
      <Skeleton.Input active style={{ width: 120, height: 40 }} />
    </div>
    {[...Array(5)].map((_, i) => (
      <Card size="small" key={i} style={{ marginBottom: 10 }} className="adm-kpi-card">
        <Skeleton active avatar={false} paragraph={{ rows: 2, width: ['70%', '40%'] }} />
      </Card>
    ))}
  </div>
)

/** Settings-style skeleton with toggle rows */
export const SettingsSkeleton = () => (
  <div className="adm-skeleton-fade">
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card size="small" className="adm-chart-card">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <Skeleton active paragraph={false} title={{ width: 140 }} style={{ flex: 1 }} />
              <Skeleton.Button active size="small" />
            </div>
          ))}
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card size="small" className="adm-chart-card">
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <Skeleton active paragraph={false} title={{ width: 140 }} style={{ flex: 1 }} />
              <Skeleton.Input active size="small" style={{ width: 60 }} />
            </div>
          ))}
        </Card>
      </Col>
    </Row>
  </div>
)
