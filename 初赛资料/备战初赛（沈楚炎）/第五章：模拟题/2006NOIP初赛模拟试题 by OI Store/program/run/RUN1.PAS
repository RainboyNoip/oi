program ex1;
var  a,b,c,i:integer;
     s:array[0..300]of integer;
begin
     read(a,b,c);
     s[0]:=a;
     s[1]:=b;
     for i:=2 to c do s[i]:=a*s[i-2]+b*s[i-1];
     writeln(s[c]);
end.
