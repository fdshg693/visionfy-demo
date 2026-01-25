# ローカル環境でのDockerによる確認の仕方

cd backend/src
docker build -t visionfy-demo-backend .

# 既存の同名コンテナがあれば強制削除（エラーは無視する）

docker rm -f my-visionfy-app 2>$null

# 新しく起動する

docker run --name my-visionfy-app -p 8080:8080 -e PORT=8080 visionfy-demo-backend
