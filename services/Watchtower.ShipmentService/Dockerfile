FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Watchtower.ShipmentService.csproj", "./"]
RUN dotnet restore "Watchtower.ShipmentService.csproj"
COPY . .
RUN dotnet publish "Watchtower.ShipmentService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Watchtower.ShipmentService.dll"]
