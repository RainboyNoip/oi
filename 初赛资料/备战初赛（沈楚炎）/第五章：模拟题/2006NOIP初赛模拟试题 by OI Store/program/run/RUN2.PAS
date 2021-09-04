program ex2;
procedure get;
var c:char;
begin
     read(c);
     if c<>'!' then get;
     write('.',c,'.');
end;
begin
     get;
end.
