# AWS Node Demo

An Express API connected to PostgreSQL and Amazon S3, with a small web UI for adding users and uploading files. The API includes `/health`, `GET /users`, `GET /users/by-email/:email`, `POST /users`, and `POST /files`. The source code is in `src/`; the UI is in `public/`.

## Run locally

Requires Node.js 20 or later and PostgreSQL. Install the dependencies, create a configuration file, and enter your database settings:

```bash
cd aws-node-check-api
npm ci
cp .env.example .env
```

Create the `aws_node_demo` database (or change `DB_NAME` in `.env`), then run `sql/init.sql` against that database to create the `users` table. For example, with `psql`:

```bash
psql -h localhost -U postgres -d aws_node_demo -f sql/init.sql
```

Start the API:

```bash
npm run dev
# Or: npm start
```

The application uses port `3000` by default. Set `PORT` to use a different port.

Open `http://localhost:3000/` to enter a user's name and email, see saved users, and upload a file to S3. Images are previewed in the browser before upload.

To enable file uploads, set `S3_BUCKET` in `.env` to an existing bucket and set `AWS_REGION` to the bucket's region (default: `ap-southeast-2`). Use AWS credentials available to the default SDK credential chain, such as a local AWS profile. The credentials need `s3:PutObject` permission for `arn:aws:s3:::YOUR_BUCKET/uploads/*`. Do not put AWS access keys in the project.

For a local PostgreSQL instance, leave `DB_SSL_CA` empty. If you connect to Amazon RDS with certificate verification, set `DB_SSL_CA` to the absolute path of the RDS CA bundle on the machine running the API. The application reads that file only when `DB_SSL_CA` is set.

## Test the API

```bash
curl http://localhost:3000/health
curl http://localhost:3000/users
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Tam","email":"tam@example.com"}'
curl 'http://localhost:3000/users/by-email/tam%40example.com'
curl http://localhost:3000/users
curl -F 'file=@./example.txt' http://localhost:3000/files
```

`/health` reports the web server's status. `GET /users` reads records from PostgreSQL in descending ID order. `GET /users/by-email/:email` returns one user or HTTP `404` if the email is not found. URL-encode the email when building the request path. `POST /users` creates a user and returns HTTP `201`; missing `name` or `email` returns `400`, and a duplicate email returns `409`.

`POST /files` accepts one `multipart/form-data` field named `file` (maximum 10 MB), uploads it under `uploads/` in S3, and returns the object key, original filename, and size. The object is private unless your bucket policy says otherwise. Missing files return `400`, oversized files return `413`, and missing `S3_BUCKET` returns `503`.

Run `npm test` to check the endpoints with a mocked database and the file upload handler with a mocked S3 client. These tests do not verify a real PostgreSQL or S3 connection.

## Deploy to AWS Elastic Beanstalk

1. Set up PostgreSQL (for example, on Amazon RDS), run `sql/init.sql` against the database, and ensure the Elastic Beanstalk environment can connect to it.
2. Create a source bundle from the project directory. Do not include `.env` in the ZIP file:

   ```bash
   zip -FS -r ../aws-node-check-api.zip src public package.json package-lock.json .ebextensions
   ```

3. Create a **Web server environment** in Elastic Beanstalk using the **Node.js 24 running on Amazon Linux 2023** platform, then upload the ZIP file. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `AWS_REGION`, and `S3_BUCKET` as environment properties. If using the RDS CA bundle, also set `DB_SSL_CA` to its path on the instance, for example `/home/ec2-user/certs/global-bundle.pem`. Ensure the file exists there. Elastic Beanstalk provides `PORT` to the application.
4. Grant the environment's EC2 instance profile `s3:PutObject` permission for `arn:aws:s3:::YOUR_BUCKET/uploads/*`.
5. After deployment, open the environment URL to use the UI, then test `/health`, the user endpoints, and `POST /files`.

`.ebextensions/healthcheck.config` sets the health check path to `/health`. The `.env` file is for local use only and is ignored by Git.

AWS documentation: [Node.js platform](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.container.html), [creating a source bundle](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/applications-sourcebundle.html), [supported platforms](https://docs.aws.amazon.com/elasticbeanstalk/latest/platforms/platforms-supported.html), [Amazon RDS CA bundles](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html).
