@REM https://stackoverflow.com/questions/42564058/how-to-use-local-docker-images-with-minikube
@REM You must first run 
@REM minikube docker-env | Invoke-Expression # On PowerShell 
@REM eval $(minikube docker-env)             # On unix shells
@REM In order to set your docker context to minikube's

dotnet build .\Orchestrator.csproj -c Debug
dotnet publish "Orchestrator.csproj" -c Debug

docker build -t orchestrator:dev -f .\Dockerfile.dev .
kubectl apply -f .\orchestrator.yml
kubectl rollout restart deployment/orchestrator
