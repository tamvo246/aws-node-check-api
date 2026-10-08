# AWS Node Check API

API Node.js nhỏ dùng để kiểm tra dữ liệu sau khi deploy lên AWS Elastic Beanstalk. Project không cần cài thêm package.

## Chạy tại máy

Yêu cầu Node.js 20 trở lên.

```bash
cd aws-node-check-api
npm start
```

Ứng dụng lắng nghe trên `0.0.0.0` và cổng `PORT` do môi trường cung cấp; mặc định là `8080`.

## Các path

| Method | Path | Kết quả |
| --- | --- | --- |
| GET | `/` | Tên API và danh sách path |
| GET | `/health` | `{"status":"ok"}` |
| GET | `/api/items` | Danh sách 3 item mẫu |
| GET | `/api/items?category=electronics` | Lọc theo category |
| GET | `/api/items/2` | Chi tiết item có ID 2 |
| GET | `/api/echo?value=hello` | Trả lại giá trị query đã nhận |

Thử nhanh:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/items
curl 'http://localhost:8080/api/items?category=electronics'
curl 'http://localhost:8080/api/echo?value=hello%20AWS'
```

Chạy kiểm tra tự động bằng `npm test`.

## Deploy lên AWS Elastic Beanstalk

1. Trong thư mục project, tạo ZIP với các file nằm ngay ở gốc gói:

   ```bash
   zip -r ../aws-node-check-api.zip app.js package.json .ebextensions
   ```

2. Trong AWS Elastic Beanstalk, tạo application và **Web server environment**. Chọn platform **Node.js 24 running on Amazon Linux 2023** và upload `aws-node-check-api.zip` làm application code.
3. Đợi environment chuyển sang trạng thái hoạt động, mở URL của environment và thử `/health`, `/api/items`, `/api/echo?value=hello`.

Elastic Beanstalk sẽ chạy lệnh `npm start` trong `package.json`, cấp biến `PORT` cho ứng dụng và dùng `/health` từ `.ebextensions/healthcheck.config` để kiểm tra ứng dụng. Dữ liệu item chỉ là dữ liệu mẫu trong bộ nhớ, không có database; deploy lại sẽ dùng đúng ba item được khai báo trong `app.js`.

Tài liệu AWS: [Node.js platform](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.container.html), [tạo source bundle](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/applications-sourcebundle.html), [các platform được hỗ trợ](https://docs.aws.amazon.com/elasticbeanstalk/latest/platforms/platforms-supported.html).
