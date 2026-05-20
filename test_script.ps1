$ErrorActionPreference = "Stop"
$root = "C:\Users\tobia\Desktop\Programas\Programas VSC\Javascript\PF_arquitectura"

# Start server
$server = Start-Process -NoNewWindow -PassThru bun "run server.js" -WorkingDirectory "$root\DataCenter"
Write-Host "Esperando a que inicie el servidor..."
Start-Sleep 5

function Test-Endpoint($method, $url, $body, $headers) {
    try {
        $params = @{
            Uri = $url
            Method = $method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        if ($body) { $params.Body = ($body | ConvertTo-Json -Compress) }
        if ($headers) { $params.Headers = $headers }
        $result = Invoke-RestMethod @params
        Write-Host "  [OK] $method $url"
        return $result
    } catch {
        Write-Host "  [ERROR] $method $url : $($_.Exception.Message)"
        return $null
    }
}

Write-Host "`n===== TEST 1: Health Check ====="
$r = Test-Endpoint -method GET -url "http://localhost:3000/"

Write-Host "`n===== TEST 2: Inicializar DB ====="
$r = Test-Endpoint -method POST -url "http://localhost:3000/api/db/init"

Write-Host "`n===== TEST 3: Login (admin) ====="
$loginBody = @{ email = "admin@datacenter.com"; password = "admin123" }
$r = Test-Endpoint -method POST -url "http://localhost:3000/auth/login" -body $loginBody
if ($r -and $r.token) {
    Write-Host "  Token: $($r.token.Substring(0,20))..."
    $global:token = $r.token
    Write-Host "  Usuario: $($r.usuario.nombre) - $($r.usuario.rol)"
}

Write-Host "`n===== TEST 4: Abrir Puerta 1 (autenticado) ====="
if ($global:token) {
    $r = Test-Endpoint -method POST -url "http://localhost:3000/api/acceso/puerta-1" -headers @{ Authorization = "Bearer $global:token" }
    if ($r) { Write-Host "  Mensaje: $($r.mensaje)" }
}

Write-Host "`n===== TEST 5: Login como empleado ====="
$loginBody2 = @{ email = "empleado@datacenter.com"; password = "empleado123" }
$r2 = Test-Endpoint -method POST -url "http://localhost:3000/auth/login" -body $loginBody2
if ($r2 -and $r2.token) {
    $global:tokenEmpleado = $r2.token
    Write-Host "  Usuario: $($r2.usuario.nombre) - $($r2.usuario.rol)"
}

Write-Host "`n===== TEST 6: Crear solicitud de visita (empleado) ====="
if ($global:tokenEmpleado) {
    $hora = (Get-Date).AddMinutes(30).ToString("yyyy-MM-ddTHH:mm:ssZ")
    $bodyVisita = @{ motivo = "Prueba de visita al datacenter"; hora_programada = $hora }
    $r = Test-Endpoint -method POST -url "http://localhost:3000/api/visitas" -body $bodyVisita -headers @{ Authorization = "Bearer $global:tokenEmpleado"; "Content-Type" = "application/json" }
    if ($r) { Write-Host "  Visita ID: $($r.solicitud.id) - Estado: $($r.solicitud.estado)" }
}

Write-Host "`n===== TEST 7: Ver visitas pendientes (admin) ====="
if ($global:token) {
    $r = Test-Endpoint -method GET -url "http://localhost:3000/api/visitas/pendientes" -headers @{ Authorization = "Bearer $global:token" }
    if ($r -and $r.Count -gt 0) {
        Write-Host "  Solicitudes pendientes: $($r.Count)"
        $global:visitaId = $r[0].id
        Write-Host "  Primera: ID=$($r[0].id), Solicitante=$($r[0].solicitante_nombre)"
        
        # Approve
        $r2 = Test-Endpoint -method POST -url "http://localhost:3000/api/visitas/$global:visitaId/aprobar" -headers @{ Authorization = "Bearer $global:token" }
        if ($r2) {
            $global:nfcCode = $r2.solicitud.codigo_nfc
            Write-Host "  Código NFC generado: $global:nfcCode"
        }
    }
}

Write-Host "`n===== TEST 8: Verificar NFC (simular escaneo) ====="
if ($global:tokenEmpleado -and $global:visitaId -and $global:nfcCode) {
    $bodyNfc = @{ codigo_nfc = $global:nfcCode }
    $r = Test-Endpoint -method POST -url "http://localhost:3000/api/visitas/$global:visitaId/verificar-nfc" -body $bodyNfc -headers @{ Authorization = "Bearer $global:tokenEmpleado"; "Content-Type" = "application/json" }
    if ($r) { Write-Host "  Resultado: $($r.mensaje)" }
}

Write-Host "`n===== TEST 9: Abrir Puerta 2 (empleado con visita) ====="
if ($global:tokenEmpleado) {
    $r = Test-Endpoint -method POST -url "http://localhost:3000/api/acceso/puerta-2" -headers @{ Authorization = "Bearer $global:tokenEmpleado" }
    if ($r) { Write-Host "  Mensaje: $($r.mensaje)" }
}

Write-Host "`n===== TEST 10: Listar usuarios (admin) ====="
if ($global:token) {
    $r = Test-Endpoint -method GET -url "http://localhost:3000/api/usuarios" -headers @{ Authorization = "Bearer $global:token" }
    if ($r) { Write-Host "  Usuarios encontrados: $($r.Count)" }
}

Write-Host "`n===== TEST 11: Comandos pendientes (para ESP32) ====="
$r = Test-Endpoint -method GET -url "http://localhost:3000/api/comandos/pendientes"
if ($r) { Write-Host "  Comandos pendientes: $($r.Count)" }

Write-Host "`n===== TEST 12: Login como gerente ====="
$loginBody3 = @{ email = "gerente@datacenter.com"; password = "gerente123" }
$r3 = Test-Endpoint -method POST -url "http://localhost:3000/auth/login" -body $loginBody3
if ($r3 -and $r3.token) {
    Write-Host "  Usuario: $($r3.usuario.nombre) - $($r3.usuario.rol)"
    
    # Gerente should NOT be able to access user management
    Write-Host "`n  Test: Gerente NO puede ver usuarios (debe fallar):"
    $r4 = Test-Endpoint -method GET -url "http://localhost:3000/api/usuarios" -headers @{ Authorization = "Bearer $r3.token" }
    if (-not $r4) { Write-Host "  [OK] Acceso denegado correctamente" }
}

# Cleanup
Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
Write-Host "`n`n===== RESUMEN ====="
Write-Host "Servidor detenido. Pruebas completadas."
