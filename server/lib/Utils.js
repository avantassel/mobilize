Utils = {
  formatPhone: function(number,dashes){
      str = number.toString().replace(/[^0-9]/g, '');

      if(!str || str.length < 9)
        return '';

      if(!dashes)
        return str;

      if(str.slice(0,1) === '1')
        str = str.slice(1);

      return str.slice(0,3) + '-' + str.slice(3,6) + '-' + str.slice(6);
  }
}
