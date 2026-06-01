curl.exe -I https://eastonlee1011.github.io/buybit.com/
curl.exe -s https://eastonlee1011.github.io/buybit.com/ -o tmp_live_check.html
Write-Output '--- Compare (live vs local index.html) ---'
if ((Get-Content tmp_live_check.html -Raw) -eq (Get-Content index.html -Raw)) {
    Write-Output 'IDENTICAL'
} else {
    Compare-Object (Get-Content tmp_live_check.html) (Get-Content index.html) | Out-String | Write-Output
}
Write-Output 'Saved tmp_live_check.html'
