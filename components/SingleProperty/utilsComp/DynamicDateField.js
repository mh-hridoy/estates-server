import React from 'react'
import { Col, Form, DatePicker } from 'antd'


const DynamicDateField = ({ label, placeholder, fieldname, name, fieldKey, ...restField }) => {
    const { Item } = Form

    return (
        <Col xs={12} sm={8} md={6} lg={4} >
            <Item {...restField} label={label} name={[name, fieldname]}  >
                <DatePicker placeholder={placeholder} style={{ margin: "0px", width: "100%" }} />
            </Item>
        </Col>
    )
}

export default DynamicDateField;