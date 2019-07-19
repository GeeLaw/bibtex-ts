#Requires -Version 5.0

[CmdletBinding()]
Param
(
    [Parameter(Position = 0)]
    [ValidateSet('Build', 'Clean', 'Rebuild')]
    [string]$Mode = 'Build'
)

Begin
{
    $script:srcPath = [System.IO.Path]::Combine($PSScriptRoot, 'src');
    $script:tmpPath = [System.IO.Path]::Combine($PSScriptRoot, 'tmp');
    $script:tmpPathWildcard = [System.IO.Path]::Combine($tmpPath, '*');
}

Process
{
    If ($Mode -eq 'Clean' -or $Mode -eq 'Rebuild')
    {
        Write-Verbose 'Removing the compiled files.';
        Get-ChildItem -Path $tmpPathWildcard -Exclude '.gitignore' |
            Remove-Item -Force -Recurse;
        If ($Mode -eq 'Clean')
        {
            Return;
        }
    }

    $local:tsc = Get-Command -Name 'tsc' `
        -CommandType 'Application';
    If ($tsc -eq $null)
    {
        Return;
    }
    If ($tsc.Count -gt 1)
    {
        $tsc = $tsc[0];
    }
    Push-Location -LiteralPath $PSScriptRoot;
    If ((Get-Location).ProviderPath -ne $PSScriptRoot)
    {
        Return;
    }
    Try
    {
        Write-Verbose 'Invoking tsc.';
        & $tsc;
    }
    Finally
    {
        Pop-Location;
    }

    Write-Verbose 'Applying the template.';
    $local:Template = [System.IO.Path]::Combine($PSScriptRoot,
        'src', 'bibtex.template.js');
    $Template = [System.IO.File]::ReadAllText($Template);
    $local:_ws = '[ \t\v\r\n]';
    $local:_fn = '[a-zA-Z0-9_.-]';
    $local:_nws = '[^ \t\v\r\n]'
    $local:Regex = "(/\*$_ws*@@$_ws*($_fn+?)$_ws*\*/$_ws*)";
    $Regex += '.+?';
    $Regex += "($_ws*/\*$_ws*\2$_ws*@@$_ws*\*/)";
    $Regex = [System.Text.RegularExpressions.Regex]::new(
        $Regex, [System.Text.RegularExpressions.RegexOptions]::Singleline
    );
    $local:Evaluator = [System.Text.RegularExpressions.MatchEvaluator]{
        Param ([System.Text.RegularExpressions.Match]$match)
        $local:target = $match.Groups[2].Value;
        $local:Content = [System.IO.Path]::Combine($PSScriptRoot,
            'tmp', $match.Groups[2].Value);
        If ($target.ToLowerInvariant().EndsWith('.js'))
        {
            $Content = [System.IO.File]::ReadAllText($Content);
        }
        Else
        {
            $target = [System.IO.Path]::Combine($Content, '__namespace.js');
            $Content = Get-ChildItem `
                -Path ([System.IO.Path]::Combine($Content, '*.js')) `
                -Exclude '__namespace.js' |
                ForEach-Object { [System.IO.File]::ReadAllText($_.FullName) };
            $Content = $Content -join "`n;";
            $Content += "`n;" + [System.IO.File]::ReadAllText($target);
        }
        $Content = $match.Groups[1].Value + $Content + $match.Groups[3].Value;
        Return $Content;
    };
    $local:Destination = [System.IO.Path]::Combine($PSScriptRoot,
        'lib', 'bibtex.js')
    [System.IO.File]::WriteAllText(
        $Destination,
        $Regex.Replace($Template, $Evaluator)
    );
}
