program ex3;
var  a:real;
     b,i:integer;
function f(var d:real):real;
begin
     f:=1.0/(1-d);
end;
begin
     read(a,b);
     for i:=b downto 1 do  a:=f(a);
     write(a:2:1);
end.
0.5 1000

