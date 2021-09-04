program ex4;
var  s:array [0..99] of integer;
     ii,i,j,n,swap:integer;
     r:boolean;

procedure swp(i:integer; j:integer);
var tmp:integer;
begin
     tmp:=s[i];
     s[i]:=s[j];
     s[j]:=tmp;
end;
procedure rev(i:integer; j:integer);
begin
     while i<j do
     begin
          swp(i,j);
          inc(i);
          dec(j);
     end;
end;
begin
     read(n);
     for i:=0 to n-1 do  read(s[i]);
     i:=n-1;
     while true do
     begin
          ii:=i;
          dec(i);
          if s[i]<s[ii] then
             begin
                  j:=n;
                  repeat
                        j:=j-1;
                  until s[i]<s[j];
                  swp(i,j);
                  rev(ii,n-1);
                  break;
             end;
     end;
     for i:=0 to n-1 do  write(s[i],' ');
end.