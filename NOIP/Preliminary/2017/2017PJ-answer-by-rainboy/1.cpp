#include<iostream>
using namespace std;
int x, p, m, i,result;
int main() {

    cin >> x >> p >> m;
    result = 1 ;
    while (p>0) {
        if (p % 2 == 1)
            result= result*x%m;
        p /= 2;
        x= x*x%m ;
    }

    cout << result<< endl;
    return 0;
}

